import { api, setTokens, clearTokens } from './client';

export async function register({ fullName, email, password, dateOfBirth }) {
  const data = await api.post(
    '/auth/register',
    { fullName, email, password, dateOfBirth },
    { skipAuth: true }
  );
  setTokens(data);
  return data.user;
}

export async function login({ email, password, rememberMe }) {
  const data = await api.post('/auth/login', { email, password, rememberMe }, { skipAuth: true });
  setTokens(data);
  return data.user;
}

export async function logout(refreshToken) {
  try {
    await api.post('/auth/logout', { refreshToken });
  } finally {
    clearTokens();
  }
}
