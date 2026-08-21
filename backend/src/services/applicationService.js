const AppDataSource = require('../config/database');
const applicationRepository = require('../repositories/applicationRepository');
const roleRepository = require('../repositories/roleRepository');
const projectRepository = require('../repositories/projectRepository');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');
const userService = require('./userService');
const subscriptionService = require('./subscriptionService');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const userRepo = () => AppDataSource.getRepository('User');
const memberRepo = () => AppDataSource.getRepository('ProjectMember');

async function apply(projectId, roleId, applicantId, { message }) {
  const role = await roleRepository.findById(roleId);
  if (!role || role.projectId !== projectId) throw AppError.notFound('Role not found');
  if (role.status !== 'open') throw AppError.conflict('This role is not currently open');

  let project = await projectRepository.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);

  const existing = await applicationRepository.findPendingByApplicantAndRole(applicantId, roleId);
  if (existing) throw AppError.conflict('You already have a pending application for this role');

  const application = await applicationRepository.create({
    projectId,
    roleId,
    applicantId,
    message: message || null,
    status: 'pending',
  });

  await projectRepository.incrementApplicantCount(projectId);

  await notificationService.notify({
    userId: project.ownerId,
    type: NOTIFICATION_TYPES.APPLICATION_RECEIVED,
    title: 'New applicant',
    message: `Someone applied for the "${role.name}" role on "${project.title}".`,
    relatedEntityType: 'application',
    relatedEntityId: application.id,
  });

  return application;
}

async function listForProject(projectId, ownerId, filters = {}) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== ownerId) throw AppError.forbidden('Only the project owner can do this');

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.roleId) where.roleId = filters.roleId;

  const applications = await applicationRepository.findByProject(projectId, where);

  // Embed applicant public-profile summary for decision-making, straight
  // from the applicant list — no extra round trip needed.
  const results = [];
  for (const application of applications) {
    const profile = await userService.getPublicProfile(application.applicantId);
    results.push({ ...application, applicant: profile });
  }
  return results;
}

async function listMine(applicantId) {
  return applicationRepository.findByApplicant(applicantId);
}

async function accept(applicationId, ownerId, { workspaceLink } = {}) {
  const application = await applicationRepository.findById(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  let project = await projectRepository.findById(application.projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== ownerId) throw AppError.forbidden('Only the project owner can do this');
  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);
  if (application.status !== 'pending') {
    throw AppError.conflict('This application has already been decided');
  }

  const role = await roleRepository.findById(application.roleId);
  if (!role) throw AppError.notFound('Role not found');

  const remaining = role.openings - role.filledCount;
  if (remaining <= 0) {
    throw AppError.conflict('This role has no remaining openings');
  }

  // Team-size cap — the real enforcement point for the plan's member
  // limit (Free=4, Standard=6, Advanced=12, owner included).
  await subscriptionService.assertCanGrowTeam(project, 1);

  const applicant = await userRepo().findOne({ where: { id: application.applicantId } });
  if (applicant.activeProjectId) {
    throw AppError.conflict(
      'This applicant is already active on another project and cannot be accepted onto a second team until they leave it'
    );
  }

  let member;
  await AppDataSource.transaction(async (manager) => {
    await manager
      .getRepository('Application')
      .update(
        { id: applicationId },
        { status: 'accepted', decidedBy: ownerId, decidedAt: new Date() }
      );

    member = await manager.getRepository('ProjectMember').save(
      manager.getRepository('ProjectMember').create({
        projectId: application.projectId,
        roleId: application.roleId,
        userId: application.applicantId,
        applicationId: application.id,
        status: 'active',
        joinedAt: new Date(),
        workspaceLink: workspaceLink || null,
        workspaceLinkUpdatedAt: workspaceLink ? new Date() : null,
      })
    );

    const newFilledCount = role.filledCount + 1;
    await manager.getRepository('ProjectRole').update(
      { id: role.id },
      {
        filledCount: newFilledCount,
        status: newFilledCount >= role.openings ? 'full' : 'open',
      }
    );

    await manager
      .getRepository('User')
      .update({ id: application.applicantId }, { activeProjectId: application.projectId });
  });

  // Notify the applicant. If a workspace link was provided, share it and
  // make clear it's optional to have used it — the owner may still prefer
  // to just reach out directly. If not, tell the applicant to expect the
  // owner to reach out via their profile's contact info.
  await notificationService.notify({
    userId: application.applicantId,
    type: NOTIFICATION_TYPES.APPLICATION_ACCEPTED,
    title: "You're in!",
    message: `You were accepted onto "${project.title}" for the role "${role.name}".`,
    relatedEntityType: 'project',
    relatedEntityId: project.id,
  });

  let ownerReminder = null;
  if (workspaceLink) {
    await notificationService.notify({
      userId: application.applicantId,
      type: NOTIFICATION_TYPES.WORKSPACE_LINK_SHARED,
      title: 'Team workspace link',
      message: `The project owner shared a workspace link for "${project.title}": ${workspaceLink}`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
    });
  } else {
    await notificationService.notify({
      userId: application.applicantId,
      type: NOTIFICATION_TYPES.CONTACT_EXPECTED,
      title: 'Check your contact info',
      message: `You were accepted onto "${project.title}". The owner hasn't shared a workspace link yet — make sure your preferred contact info on your profile is up to date, as they'll reach out to get started.`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
    });
    // Surfaced back to the owner's client as a popup/modal prompt right in
    // the accept response — no workspace link was set, so nudge them to go
    // contact the applicant via their profile instead.
    ownerReminder = {
      show: true,
      message:
        "You didn't add a workspace link. That's completely fine — you can visit the applicant's profile and reach out using their contact info instead. You can also add a workspace link later at any time.",
    };
  }

  return {
    application: { ...application, status: 'accepted' },
    membership: member,
    ownerReminder,
  };
}

async function reject(applicationId, ownerId, { rejectionReason } = {}) {
  const application = await applicationRepository.findById(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  const project = await projectRepository.findById(application.projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== ownerId) throw AppError.forbidden('Only the project owner can do this');
  if (application.status !== 'pending') {
    throw AppError.conflict('This application has already been decided');
  }

  await applicationRepository.save({
    ...application,
    status: 'rejected',
    rejectionReason: rejectionReason || null,
    decidedBy: ownerId,
    decidedAt: new Date(),
  });

  await notificationService.notify({
    userId: application.applicantId,
    type: NOTIFICATION_TYPES.APPLICATION_REJECTED,
    title: 'Application update',
    message: rejectionReason
      ? `Your application to "${project.title}" was not accepted. Reason: ${rejectionReason}`
      : `Your application to "${project.title}" was not accepted this time.`,
    relatedEntityType: 'project',
    relatedEntityId: project.id,
  });

  return { ...application, status: 'rejected', rejectionReason: rejectionReason || null };
}

module.exports = { apply, listForProject, listMine, accept, reject };
