import { api } from './client';

export const applyToRole = (projectId, roleId, payload) =>
  api.post(`/projects/${projectId}/roles/${roleId}/applications`, payload);

export const listApplicationsForProject = (projectId, params = {}) => {
  const usp = new URLSearchParams(params).toString();
  return api.get(`/projects/${projectId}/applications${usp ? `?${usp}` : ''}`);
};

export const listMyApplications = () => api.get('/users/me/applications');

export const acceptApplication = (id, payload) => api.post(`/applications/${id}/accept`, payload);
export const rejectApplication = (id, payload) => api.post(`/applications/${id}/reject`, payload);
