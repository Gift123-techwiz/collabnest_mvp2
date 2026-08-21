import { api, API_BASE_URL, getAccessToken } from './client';

export const getMe = () => api.get('/users/me');
export const updateMe = (payload) => api.patch('/users/me', payload);
export const getPublicProfile = (userId) => api.get(`/users/${userId}`);
export const getMyStats = () => api.get('/users/me/stats');
export const getShareLink = () => api.get('/users/me/share-link');

export const addSkill = (skillId) => api.post('/users/me/skills', { skillId });
export const removeSkill = (skillId) => api.delete(`/users/me/skills/${skillId}`);

export const addPortfolioLink = (payload) => api.post('/users/me/portfolio-links', payload);
export const removePortfolioLink = (id) => api.delete(`/users/me/portfolio-links/${id}`);

// Multipart upload — uses fetch directly through the shared token since it
// needs a FormData body (no JSON content-type).
export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE_URL}/users/me/profile-picture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: formData,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Upload failed');
  }
  return body.data;
}

export const changePassword = (payload) => api.patch('/users/me/password', payload);
export const deleteAccount = (payload) => api.delete('/users/me', { body: payload });
