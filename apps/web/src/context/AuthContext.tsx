'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { User } from '@hh/domain';

import { AuthModal } from '../components/auth/AuthModal';

interface AuthModalOptions {
  reason?: string;
  initialPhone?: string;
  onSuccess?: (user: User) => void;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [modalOptions, setModalOptions] = useState<AuthModalOptions>({});

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    setModalOptions(options ?? {});
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleModalSuccess = useCallback(
    (authedUser: User) => {
      setUser(authedUser);
      setIsAuthModalOpen(false);
      if (modalOptions.onSuccess) {
        modalOptions.onSuccess(authedUser);
      }
    },
    [modalOptions]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      refreshUser,
      logout
    }),
    [user, isLoading, isAuthModalOpen, openAuthModal, closeAuthModal, refreshUser, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={handleModalSuccess}
        reason={modalOptions.reason}
        initialPhone={modalOptions.initialPhone}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
