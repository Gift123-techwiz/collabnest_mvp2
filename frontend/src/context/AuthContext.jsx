import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import * as usersApi from '../api/users';
import { getAccessToken, getRefreshToken, clearTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    try {
      const me = await usersApi.getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setInitializing(false));

    function onSessionExpired() {
      setUser(null);
    }
    window.addEventListener('collabnest:session-expired', onSessionExpired);
    return () => window.removeEventListener('collabnest:session-expired', onSessionExpired);
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authApi.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const newUser = await authApi.register(payload);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch {
      clearTokens();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    setUser,
    initializing,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
