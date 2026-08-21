const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY = 'collabnest_access_token';
const REFRESH_TOKEN_KEY = 'collabnest_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// A custom error class carrying the API's error envelope so UI code can
// read .message and .details/.status directly.
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let refreshPromise = null;

async function performRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError('Not authenticated', 401);

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    clearTokens();
    throw new ApiError(body?.error?.message || 'Session expired', res.status);
  }
  setTokens(body.data);
  return body.data;
}

// Single entrypoint for every API call. Attaches the bearer token, retries
// once on a 401 by refreshing the access token (unless the call itself was
// the refresh/login/register endpoint), and unwraps the { success, data }
// / { success: false, error } envelope from utils/response.js on the backend.
async function request(path, { method = 'GET', body, isForm = false, skipAuth = false, skipRefreshRetry = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';

  const token = getAccessToken();
  if (token && !skipAuth) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  // No Content
  if (res.status === 204) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.ok && payload?.success) {
    return payload.data;
  }

  // Attempt one silent token refresh on 401 (expired access token), then
  // retry the original request exactly once.
  if (res.status === 401 && !skipAuth && !skipRefreshRetry && getRefreshToken()) {
    try {
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return request(path, { method, body, isForm, skipAuth, skipRefreshRetry: true });
    } catch (err) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('collabnest:session-expired'));
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
  }

  const message = payload?.error?.message || 'Something went wrong. Please try again.';
  throw new ApiError(message, res.status, payload?.error?.details);
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path, opts) => request(path, { method: 'DELETE', ...opts }),
};

export { API_BASE_URL };
