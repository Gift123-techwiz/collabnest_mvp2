export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'not_specified', label: 'Not specified' },
];

export const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'flexible', label: 'Flexible' },
];

export const PORTFOLIO_LINK_PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'behance', label: 'Behance' },
  { value: 'dribbble', label: 'Dribbble' },
  { value: 'other', label: 'Other' },
];

export const PROJECT_STATUS_LABELS = {
  draft: 'Draft',
  recruiting: 'Recruiting',
  paused: 'Paused',
  in_progress: 'In progress',
  completed: 'Completed',
  archived: 'Archived',
  payment_required: 'Locked — payment required',
};

export const PROJECT_STATUS_BADGE = {
  draft: 'badge-neutral',
  recruiting: 'badge-success',
  paused: 'badge-warning',
  in_progress: 'badge-primary',
  completed: 'badge-neutral',
  archived: 'badge-neutral',
  payment_required: 'badge-danger',
};

export const APPLICATION_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Not accepted',
};

export const TASK_STATUS_LABELS = {
  assigned: 'Assigned',
  submitted: 'Submitted for review',
  approved: 'Approved',
  rejected: 'Sent back',
};

export const TASK_STATUS_BADGE = {
  assigned: 'badge-neutral',
  submitted: 'badge-primary',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

export const PLAN_LABELS = {
  free: 'Free — Test Run',
  standard: 'Standard — Normal Team',
  advanced: 'Advanced — Big Team',
};

export const PLAN_PRICING = {
  free: { monthly: 0, maxTeamSize: 4 },
  standard: { monthly: 3500, maxTeamSize: 6 },
  advanced: { monthly: 5000, maxTeamSize: 12 },
};

export const NOTIFICATION_TYPE_META = {
  application_received: { label: 'New applicant', icon: 'inbox' },
  application_accepted: { label: "You're in!", icon: 'check' },
  application_rejected: { label: 'Application update', icon: 'info' },
  workspace_link_shared: { label: 'Workspace link', icon: 'link' },
  contact_expected: { label: 'Check your contact info', icon: 'user' },
  member_left: { label: 'Teammate left', icon: 'user-minus' },
  role_reopened: { label: 'Role reopened', icon: 'refresh' },
  task_submitted: { label: 'Task submitted', icon: 'file' },
  task_approved: { label: 'Task approved', icon: 'check' },
  task_rejected: { label: 'Task sent back', icon: 'file' },
  project_completed: { label: 'Project completed', icon: 'flag' },
  rating_request: { label: 'Rate your teammates', icon: 'star' },
  rating_received: { label: 'New rating', icon: 'star' },
  profile_completion_reminder: { label: 'Profile update', icon: 'user' },
  subscription_expired: { label: 'Subscription ended', icon: 'lock' },
  payment_successful: { label: 'Payment successful', icon: 'check' },
};

export function formatNaira(amount) {
  if (amount === null || amount === undefined) return '₦0';
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
