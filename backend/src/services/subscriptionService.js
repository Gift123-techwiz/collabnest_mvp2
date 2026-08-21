const crypto = require('crypto');
const AppDataSource = require('../config/database');
const projectRepository = require('../repositories/projectRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const paymentEventRepository = require('../repositories/paymentEventRepository');
const paystack = require('../config/paystack');
const env = require('../config/env');
const notificationService = require('./notificationService');
const AppError = require('../utils/AppError');
const {
  SUBSCRIPTION_PLANS,
  PLAN_CONFIG,
  priceForMonths,
  NOTIFICATION_TYPES,
  PROJECT_LOCK_STATUS,
} = require('../utils/constants');

const memberRepo = () => AppDataSource.getRepository('ProjectMember');
const userRepo = () => AppDataSource.getRepository('User');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Calendar months are irregular; we use a fixed 30-day month for
// subscription math so every plan/month combination is predictable and
// testable (matches how the 2,500 / 3,500 / 5,000 naira figures were priced).
const DAYS_PER_MONTH = 30;

function addMonths(date, months) {
  return new Date(date.getTime() + months * DAYS_PER_MONTH * MS_PER_DAY);
}

// ---- Team size ----
// "Team size" = the owner's seat + every currently-active member. The
// owner always occupies one seat on their own project.
async function getCurrentTeamSize(projectId) {
  const activeMembers = await memberRepo().count({ where: { projectId, status: 'active' } });
  return activeMembers + 1; // +1 for the owner
}

async function assertCanGrowTeam(project, additionalSeats = 1) {
  const cfg = PLAN_CONFIG[project.currentPlan];
  const currentSize = await getCurrentTeamSize(project.id);
  if (currentSize + additionalSeats > cfg.maxTeamSize) {
    const nextPlan =
      project.currentPlan === SUBSCRIPTION_PLANS.STANDARD
        ? ' Upgrade to Advanced (5,000 naira/mo, up to 12 members) to add more.'
        : '';
    throw AppError.conflict(
      `This project's ${project.currentPlan} plan caps the team at ${cfg.maxTeamSize} members (including the owner).${nextPlan}`,
      { currentPlan: project.currentPlan, maxTeamSize: cfg.maxTeamSize, currentSize }
    );
  }
}

// ---- Free plan initialisation (called once, at project creation) ----
async function initializeFreePlan(project) {
  const cfg = PLAN_CONFIG[SUBSCRIPTION_PLANS.FREE];
  const startDate = new Date();
  const endDate = addMonths(startDate, cfg.freeMonths);

  await subscriptionRepository.create({
    projectId: project.id,
    plan: SUBSCRIPTION_PLANS.FREE,
    months: cfg.freeMonths,
    amountNaira: 0,
    startDate,
    endDate,
    status: 'active',
    paystackReference: null,
    isFreeExtension: false,
  });

  await projectRepository.update(project.id, {
    currentPlan: SUBSCRIPTION_PLANS.FREE,
    freePlanUsed: true,
    subscriptionExpiresAt: endDate,
  });
}

// ---- Lazy expiry check ----
// No cron job on free hosting — instead, every time a project is read or
// acted on, we check whether its subscription has lapsed and flip it to
// 'payment_required' on the spot if so.
async function lazyRefreshAccess(project) {
  if (!project.subscriptionExpiresAt) return project;
  if (['completed', 'archived', PROJECT_LOCK_STATUS].includes(project.status)) return project;

  const expiresAt = new Date(project.subscriptionExpiresAt);
  if (expiresAt > new Date()) return project;

  // Subscription has lapsed — lock the project, remembering what it was so
  // we can restore it exactly when the owner pays again.
  await projectRepository.update(project.id, {
    status: PROJECT_LOCK_STATUS,
    statusBeforeLock: project.status,
  });

  const latestActive = await subscriptionRepository.findLatestActive(project.id);
  if (latestActive) {
    await subscriptionRepository.update(latestActive.id, { status: 'expired' });
  }

  await notificationService.notify({
    userId: project.ownerId,
    type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
    title: 'Subscription ended — project locked',
    message: `"${project.title}"'s subscription has ended. Subscribe again to restore access for you and your team.`,
    relatedEntityType: 'project',
    relatedEntityId: project.id,
  });

  return { ...project, status: PROJECT_LOCK_STATUS, statusBeforeLock: project.status };
}

function assertAccessible(project) {
  if (project.status === PROJECT_LOCK_STATUS) {
    throw AppError.paymentRequired(
      'This project is locked because its subscription has ended. The owner needs to subscribe again to restore access.',
      { projectId: project.id }
    );
  }
}

// ---- Plan/month validation ----
function assertValidPlanSelection(plan, months) {
  if (!Object.values(SUBSCRIPTION_PLANS).includes(plan) || plan === SUBSCRIPTION_PLANS.FREE) {
    throw AppError.badRequest('plan must be "standard" or "advanced"');
  }
  const cfg = PLAN_CONFIG[plan];
  if (!cfg.allowedMonths.includes(months)) {
    throw AppError.badRequest(`months must be one of: ${cfg.allowedMonths.join(', ')}`);
  }
}

// ---- Initiate a payment (Standard/Advanced purchase, or the one-time
// Free-plan Month-3 extension) ----
async function initiatePayment(projectId, userId, { plan, months }) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== userId) {
    throw AppError.forbidden('Only the project owner can manage billing');
  }

  const owner = await userRepo().findOne({ where: { id: userId } });

  // Special case: the 2,500 naira Free-plan Month-3 extension.
  if (plan === SUBSCRIPTION_PLANS.FREE) {
    const cfg = PLAN_CONFIG[SUBSCRIPTION_PLANS.FREE];
    if (!project.freePlanUsed) {
      throw AppError.conflict('This project has not used its Free plan yet — nothing to extend.');
    }
    if (project.freeExtensionUsed) {
      throw AppError.conflict(
        'Free plan has ended. Please upgrade to Standard (3,500 naira/month) to continue.'
      );
    }
    const amountNaira = cfg.extensionPriceNaira;
    const reference = `collabnest_${projectId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const { data } = await paystack.initializeTransaction({
      email: owner.email,
      amountNaira,
      reference,
      metadata: {
        projectId,
        userId,
        plan: SUBSCRIPTION_PLANS.FREE,
        months: cfg.extensionMonths,
        isFreeExtension: true,
      },
      callbackUrl: `${env.FRONTEND_BILLING_CALLBACK_URL}?projectId=${projectId}`,
    });

    await paymentEventRepository.create({
      projectId,
      initiatedBy: userId,
      plan: SUBSCRIPTION_PLANS.FREE,
      months: cfg.extensionMonths,
      amountNaira,
      eventType: 'initiated',
      paystackReference: reference,
    });

    return { authorizationUrl: data.authorization_url, reference, amountNaira };
  }

  // Standard / Advanced purchase or renewal.
  assertValidPlanSelection(plan, months);
  const amountNaira = priceForMonths(plan, months);
  const reference = `collabnest_${projectId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const { data } = await paystack.initializeTransaction({
    email: owner.email,
    amountNaira,
    reference,
    metadata: { projectId, userId, plan, months, isFreeExtension: false },
    callbackUrl: `${env.FRONTEND_BILLING_CALLBACK_URL}?projectId=${projectId}`,
  });

  await paymentEventRepository.create({
    projectId,
    initiatedBy: userId,
    plan,
    months,
    amountNaira,
    eventType: 'initiated',
    paystackReference: reference,
  });

  return { authorizationUrl: data.authorization_url, reference, amountNaira };
}

// ---- Apply a confirmed successful payment (called from the webhook, and
// again defensively from the manual "verify" endpoint the frontend polls
// right after Paystack's redirect) ----
async function applySuccessfulPayment({ reference, amountNairaFromGateway, metadata }) {
  const alreadyApplied = await paymentEventRepository.hasSucceeded(reference);
  if (alreadyApplied) return; // idempotent — webhook + manual verify can both fire

  const { projectId, plan, months, isFreeExtension } = metadata;
  const project = await projectRepository.findById(projectId);
  if (!project) return;

  const now = new Date();
  // Extend from the current expiry if it's still in the future (renewal
  // before lapsing); otherwise start fresh from now (renewing after a
  // lapse, or the very first paid period).
  const base =
    project.subscriptionExpiresAt && new Date(project.subscriptionExpiresAt) > now
      ? new Date(project.subscriptionExpiresAt)
      : now;
  const endDate = addMonths(base, months);

  await subscriptionRepository.create({
    projectId,
    plan,
    months,
    amountNaira: amountNairaFromGateway,
    startDate: now,
    endDate,
    status: 'active',
    paystackReference: reference,
    isFreeExtension: !!isFreeExtension,
  });

  const restoredStatus =
    project.status === PROJECT_LOCK_STATUS
      ? project.statusBeforeLock || 'recruiting'
      : project.status;

  await projectRepository.update(projectId, {
    currentPlan: plan,
    subscriptionExpiresAt: endDate,
    status: restoredStatus,
    statusBeforeLock: null,
    ...(isFreeExtension ? { freeExtensionUsed: true } : {}),
  });

  await paymentEventRepository.create({
    projectId,
    initiatedBy: project.ownerId,
    plan,
    months,
    amountNaira: amountNairaFromGateway,
    eventType: 'succeeded',
    paystackReference: reference,
  });

  await notificationService.notify({
    userId: project.ownerId,
    type: NOTIFICATION_TYPES.PAYMENT_SUCCESSFUL,
    title: 'Payment successful',
    message: `Your payment for "${project.title}" was successful. The project is now active on the ${plan} plan.`,
    relatedEntityType: 'project',
    relatedEntityId: projectId,
  });
}

async function applyFailedPayment({ reference, metadata }) {
  const { projectId, plan, months, userId } = metadata || {};
  if (!projectId) return;
  await paymentEventRepository.create({
    projectId,
    initiatedBy: userId,
    plan: plan || 'unknown',
    months: months || 0,
    amountNaira: 0,
    eventType: 'failed',
    paystackReference: reference,
  });
}

// ---- Webhook entrypoint ----
async function handleWebhook(rawBody, signatureHeader) {
  if (!paystack.verifyWebhookSignature(rawBody, signatureHeader)) {
    throw AppError.unauthorized('Invalid webhook signature');
  }
  const event = JSON.parse(rawBody.toString('utf8'));

  if (event.event === 'charge.success') {
    const { reference, amount, metadata } = event.data;
    await applySuccessfulPayment({
      reference,
      amountNairaFromGateway: Math.round(amount / 100),
      metadata,
    });
  } else if (event.event === 'charge.failed') {
    await applyFailedPayment({ reference: event.data.reference, metadata: event.data.metadata });
  }
}

// ---- Manual verify (frontend calls this right after the Paystack
// redirect, as a fast-path — webhook is still the source of truth and will
// also fire, but this avoids the user staring at a spinner waiting on it) ----
async function verifyPayment(reference) {
  const { data } = await paystack.verifyTransaction(reference);
  if (data.status === 'success') {
    await applySuccessfulPayment({
      reference,
      amountNairaFromGateway: Math.round(data.amount / 100),
      metadata: data.metadata,
    });
    return { status: 'success' };
  }
  if (data.status === 'failed') {
    await applyFailedPayment({ reference, metadata: data.metadata });
  }
  return { status: data.status };
}

async function getBillingStatus(projectId, userId) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== userId) {
    throw AppError.forbidden('Only the project owner can view billing');
  }

  const refreshed = await lazyRefreshAccess(project);
  const history = await subscriptionRepository.findByProject(projectId);
  const teamSize = await getCurrentTeamSize(projectId);

  return {
    currentPlan: refreshed.currentPlan,
    status: refreshed.status,
    subscriptionExpiresAt: refreshed.subscriptionExpiresAt,
    freePlanUsed: refreshed.freePlanUsed,
    freeExtensionUsed: refreshed.freeExtensionUsed,
    teamSize,
    maxTeamSize: PLAN_CONFIG[refreshed.currentPlan].maxTeamSize,
    plans: PLAN_CONFIG,
    history,
  };
}

module.exports = {
  getCurrentTeamSize,
  assertCanGrowTeam,
  initializeFreePlan,
  lazyRefreshAccess,
  assertAccessible,
  initiatePayment,
  handleWebhook,
  verifyPayment,
  getBillingStatus,
};
