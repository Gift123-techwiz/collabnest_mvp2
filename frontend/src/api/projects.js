import { api } from './client';

function toQueryString(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => usp.append(key, v));
    } else {
      usp.append(key, value);
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export const searchProjects = (params) => api.get(`/projects${toQueryString(params)}`);
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (payload) => api.post('/projects', payload);
export const updateProject = (id, payload) => api.patch(`/projects/${id}`, payload);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

export const pauseProject = (id) => api.post(`/projects/${id}/pause`);
export const resumeProject = (id) => api.post(`/projects/${id}/resume`);
export const closeRecruitment = (id) => api.post(`/projects/${id}/close-recruitment`);
export const reopenRecruitment = (id) => api.post(`/projects/${id}/reopen-recruitment`);
export const archiveProject = (id) => api.post(`/projects/${id}/archive`);
export const completeProject = (id) => api.post(`/projects/${id}/complete`);

// ---- Roles ----
export const createRole = (projectId, payload) => api.post(`/projects/${projectId}/roles`, payload);
export const updateRole = (projectId, roleId, payload) =>
  api.patch(`/projects/${projectId}/roles/${roleId}`, payload);
export const deleteRole = (projectId, roleId, confirm) =>
  api.delete(`/projects/${projectId}/roles/${roleId}${confirm ? '?confirm=true' : ''}`);

// ---- Tasks (nested under role for creation) ----
export const createRoleTask = (projectId, roleId, payload) =>
  api.post(`/projects/${projectId}/roles/${roleId}/tasks`, payload);
