// Centralised enums and constant lists used across entities, services, and validators.

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'not_specified'];

const AVAILABILITY_OPTIONS = ['full_time', 'part_time', 'weekends', 'flexible'];

const PORTFOLIO_LINK_PLATFORMS = ['github', 'linkedin', 'website', 'behance', 'dribbble', 'other'];

const PROJECT_STATUSES = [
  'draft', // created, not yet published to Discovery
  'recruiting', // published, accepting applications
  'paused', // hidden from Discovery, team retains access
  'in_progress', // recruitment closed, team working
  'completed', // marked complete by owner, irreversible
  'archived', // permanently read-only
  'payment_required', // subscription lapsed — locked until owner re-subscribes
];

const PROJECT_ROLE_STATUSES = ['open', 'full', 'closed'];

const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'];

const PROJECT_MEMBER_STATUSES = ['active', 'left', 'completed'];

const TASK_STATUSES = ['assigned', 'submitted', 'approved', 'rejected'];

// Notification types. Two are "locked" — the user cannot disable them (see
// NotificationPreference). This list intentionally goes beyond the 14 types
// sketched in the original spec because the client added new events
// (workspace link, rejection reason, profile completion) that need their own
// in-app notification type.
const NOTIFICATION_TYPES = {
  APPLICATION_RECEIVED: 'application_received', // -> project owner
  APPLICATION_ACCEPTED: 'application_accepted', // -> applicant
  APPLICATION_REJECTED: 'application_rejected', // -> applicant
  WORKSPACE_LINK_SHARED: 'workspace_link_shared', // -> new member, link provided
  CONTACT_EXPECTED: 'contact_expected', // -> new member, no link provided yet
  MEMBER_LEFT: 'member_left', // -> project owner
  ROLE_REOPENED: 'role_reopened', // -> project owner (informational)
  TASK_SUBMITTED: 'task_submitted', // -> project owner
  TASK_APPROVED: 'task_approved', // -> member
  TASK_REJECTED: 'task_rejected', // -> member
  PROJECT_COMPLETED: 'project_completed', // -> all members
  RATING_REQUEST: 'rating_request', // -> all members, fired with PROJECT_COMPLETED
  RATING_RECEIVED: 'rating_received', // -> ratee
  PROFILE_COMPLETION_REMINDER: 'profile_completion_reminder', // -> self, nudge to finish profile
  SUBSCRIPTION_EXPIRED: 'subscription_expired', // -> project owner, project just got locked
  PAYMENT_SUCCESSFUL: 'payment_successful', // -> project owner, project unlocked/extended
};

// Notification types that cannot be disabled via preferences — critical to
// the team-formation loop (acceptance/rejection outcomes).
const LOCKED_NOTIFICATION_TYPES = [
  NOTIFICATION_TYPES.APPLICATION_ACCEPTED,
  NOTIFICATION_TYPES.APPLICATION_REJECTED,
];

const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPES);

// Fields considered for profile-completion percentage. Each is weighted
// equally. Order doesn't matter; the calculator in userService reads these.
const PROFILE_COMPLETION_FIELDS = [
  'profilePictureUrl',
  'bio',
  'country',
  'phoneNumber',
  'hasAtLeastOneSkill', // derived, not a literal column
  'experienceLevel',
  'yearsOfExperience',
  'availability',
];
const PROFILE_COMPLETION_THRESHOLD = 80; // percent, at/above this => profileComplete = true

const PASSWORD_MIN_LENGTH = 8; // PRD wins over the security docs' 10+/12+ recommendation (client decision)

// PRD §"Data Privacy": target audience includes students who may be under 18;
// recommends a minimum age policy. 16+ is what the PRD recommends.
const MINIMUM_AGE = 16;

const BIO_MAX_LENGTH = 300;
const APPLICATION_MESSAGE_MAX_LENGTH = 300;
const PROJECT_TITLE_MAX_LENGTH = 80;
const PROJECT_DESCRIPTION_MIN_LENGTH = 50;

const PROFILE_PICTURE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const PROFILE_PICTURE_ALLOWED_MIME = ['image/jpeg', 'image/png'];

// ---- Subscription / payment plans ----
// Team size = total active project_members (owner counts as a member seat
// once they've filled/held a role; enforced at role-openings and
// application-accept time — see subscriptionService).
const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  STANDARD: 'standard',
  ADVANCED: 'advanced',
};

const PLAN_CONFIG = {
  [SUBSCRIPTION_PLANS.FREE]: {
    maxTeamSize: 4,
    monthlyPriceNaira: 0,
    freeMonths: 2, // months 1-2 are ₦0
    extensionMonths: 1, // the one paid Month-3 extension
    extensionPriceNaira: 2500,
    usableOnce: true, // a project can only ever run the Free plan once
  },
  [SUBSCRIPTION_PLANS.STANDARD]: {
    maxTeamSize: 6, // 7th member forces an Advanced upgrade
    monthlyPriceNaira: 3500,
    allowedMonths: [1, 6, 12],
    maxMonthsPerPurchase: 12,
  },
  [SUBSCRIPTION_PLANS.ADVANCED]: {
    maxTeamSize: 12,
    monthlyPriceNaira: 5000,
    allowedMonths: [1, 6, 12],
    maxMonthsPerPurchase: 12,
  },
};

// No bulk discount — N months is simply N x monthly price.
function priceForMonths(plan, months) {
  const cfg = PLAN_CONFIG[plan];
  if (!cfg || !cfg.monthlyPriceNaira) return 0;
  return cfg.monthlyPriceNaira * months;
}

const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'];

const PAYMENT_EVENT_TYPES = ['initiated', 'succeeded', 'failed', 'refunded'];

// New project status — set when a subscription lapses. Distinct from
// 'paused' (owner-chosen) so the UI can show a "subscribe to regain access"
// prompt instead of a generic paused state.
const PROJECT_LOCK_STATUS = 'payment_required';

module.exports = {
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
  PORTFOLIO_LINK_PLATFORMS,
  PROJECT_STATUSES,
  PROJECT_ROLE_STATUSES,
  APPLICATION_STATUSES,
  PROJECT_MEMBER_STATUSES,
  TASK_STATUSES,
  NOTIFICATION_TYPES,
  ALL_NOTIFICATION_TYPES,
  LOCKED_NOTIFICATION_TYPES,
  PROFILE_COMPLETION_FIELDS,
  PROFILE_COMPLETION_THRESHOLD,
  PASSWORD_MIN_LENGTH,
  BIO_MAX_LENGTH,
  APPLICATION_MESSAGE_MAX_LENGTH,
  PROJECT_TITLE_MAX_LENGTH,
  PROJECT_DESCRIPTION_MIN_LENGTH,
  PROFILE_PICTURE_MAX_BYTES,
  PROFILE_PICTURE_ALLOWED_MIME,
  MINIMUM_AGE,
  SUBSCRIPTION_PLANS,
  PLAN_CONFIG,
  priceForMonths,
  SUBSCRIPTION_STATUSES,
  PAYMENT_EVENT_TYPES,
  PROJECT_LOCK_STATUS,
};
