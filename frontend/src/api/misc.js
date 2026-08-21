import { api } from './client';

// ---- Memberships ----
export const listProjectMembers = (projectId) => api.get(`/projects/${projectId}/members`);
export const leaveMembership = (membershipId, payload) =>
  api.post(`/memberships/${membershipId}/leave`, payload);
export const setWorkspaceLink = (membershipId, workspaceLink) =>
  api.patch(`/memberships/${membershipId}/workspace-link`, { workspaceLink });

// ---- Tasks ----
export const listProjectTasks = (projectId) => api.get(`/projects/${projectId}/tasks`);
export const updateTask = (taskId, payload) => api.patch(`/tasks/${taskId}`, payload);
export const submitTask = (taskId) => api.patch(`/tasks/${taskId}/submit`);
export const approveTask = (taskId) => api.post(`/tasks/${taskId}/approve`);
export const rejectTask = (taskId) => api.post(`/tasks/${taskId}/reject`);

// ---- Ratings ----
export const createRating = (projectId, payload) => api.post(`/projects/${projectId}/ratings`, payload);
export const listRatingsForUser = (userId) => api.get(`/users/${userId}/ratings`);

// ---- Notifications ----
export const listNotifications = (params = {}) => {
  const usp = new URLSearchParams(params).toString();
  return api.get(`/notifications${usp ? `?${usp}` : ''}`);
};
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');

export const getNotificationPreferences = () => api.get('/users/me/notification-preferences');
export const updateNotificationPreference = (type, enabled) =>
  api.patch('/users/me/notification-preferences', { type, enabled });

// ---- Taxonomy ----
export const listSkills = (q) => api.get(`/skills${q ? `?q=${encodeURIComponent(q)}` : ''}`);
export const listCategories = () => api.get('/categories');

// ---- Subscriptions / billing ----
export const getBillingStatus = (projectId) => api.get(`/projects/${projectId}/billing`);
export const initiatePayment = (projectId, payload) =>
  api.post(`/projects/${projectId}/billing/pay`, payload);
export const verifyPayment = (reference) => api.get(`/billing/verify?reference=${encodeURIComponent(reference)}`);

// ---- Dashboard / analytics ----
export const getDashboardOverview = () => api.get('/dashboard');
export const getPersonalAnalytics = () => api.get('/users/me/analytics');
