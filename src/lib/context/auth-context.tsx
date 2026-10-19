// src/lib/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminUser } from '@/types/api';
import { authApi } from '@/lib/api/client';
import { setAuthCookie, getAuthCookie, removeAuthCookie } from '@/lib/cookies';
import { useToast } from './toast-context';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  showIdleWarning: boolean;
  dismissIdleWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes server session timeout
const WARN_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes warning modal

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { success, error, info } = useToast();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);

  // Initialize auth state from cookies & storage on mount
  useEffect(() => {
    try {
      const cookieToken = getAuthCookie();
      const storedToken = sessionStorage.getItem('adminToken');
      const storedAdmin = sessionStorage.getItem('adminUser');
      const activeToken = cookieToken || storedToken;

      if (activeToken) {
        // Keep both storage and cookie in sync
        setToken(activeToken);
        if (!cookieToken) {
          setAuthCookie(activeToken);
        }
        if (!storedToken) {
          sessionStorage.setItem('adminToken', activeToken);
        }
        if (storedAdmin) {
          setAdmin(JSON.parse(storedAdmin));
        }
      } else {
        setToken(null);
        setAdmin(null);
        removeAuthCookie();
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
      }
    } catch (e) {
      console.error('Error reading auth state from storage/cookies', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback((reason?: string) => {
    // Clear cookies for proxy.ts route protection
    removeAuthCookie();
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    setToken(null);
    setAdmin(null);
    setShowIdleWarning(false);
    if (reason) {
      info(reason);
      router.push(`/login?reason=${encodeURIComponent(reason)}`);
    } else {
      success('Logged out successfully');
      router.push('/login');
    }
  }, [router, info, success]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        const { token: receivedToken, admin: receivedAdmin } = res.data;

        // Save token in cookie for proxy.ts and in storage for client queries
        setAuthCookie(receivedToken);
        sessionStorage.setItem('adminToken', receivedToken);
        sessionStorage.setItem('adminUser', JSON.stringify(receivedAdmin));

        setToken(receivedToken);
        setAdmin(receivedAdmin);
        success(res.message || 'Welcome back, Super Admin!');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Login failed';
      error(errorMsg);
      throw err;
    }
  };

  // Idle timeout tracking
  useEffect(() => {
    if (!token) return;

    let warnTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);

      warnTimer = setTimeout(() => {
        setShowIdleWarning(true);
      }, WARN_TIMEOUT_MS);

      logoutTimer = setTimeout(() => {
        logout('Your session has expired due to inactivity. Please log in again.');
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      if (!showIdleWarning) {
        resetTimers();
      }
    };

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [token, showIdleWarning, logout]);

  const dismissIdleWarning = () => {
    setShowIdleWarning(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        login,
        logout,
        showIdleWarning,
        dismissIdleWarning,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
