import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, getApiErrorMessage, getStoredAuthToken, setStoredAuthToken } from '../api/financeApi';
import { AuthContext } from './AuthContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applySession = useCallback((session) => {
    setStoredAuthToken(session.token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = getStoredAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const session = await authApi.me();
        if (active) {
          setUser(session.user);
        }
      } catch {
        setStoredAuthToken(null);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError('');
    try {
      const session = await authApi.login(credentials);
      applySession(session);
      return session.user;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      throw err;
    }
  }, [applySession]);

  const register = useCallback(async (account) => {
    setError('');
    try {
      const session = await authApi.register(account);
      applySession(session);
      return session.user;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      throw err;
    }
  }, [applySession]);


  const updateProfile = useCallback(async (profile) => {
    setError('');
    try {
      const result = await authApi.updateProfile(profile);
      const nextUser = result.user || result;
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (passwords) => {
    setError('');
    try {
      return await authApi.changePassword(passwords);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      throw err;
    }
  }, []);

  const requestPasswordReset = useCallback(async (request) => {
    setError('');
    try {
      return await authApi.requestPasswordReset(request);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setStoredAuthToken(null);
    setUser(null);
    setError('');
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    register,
    updateProfile,
    changePassword,
    requestPasswordReset,
    logout,
    clearError: () => setError(''),
  }), [changePassword, error, loading, login, logout, register, requestPasswordReset, updateProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
