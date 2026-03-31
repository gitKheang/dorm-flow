'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import {
  createDemoSession,
  DemoSession,
  EnabledModule,
  restoreDemoSession,
  SESSION_STORAGE_KEY,
  UserRole,
} from '@/lib/demoSession';

interface DemoSessionContextValue {
  isHydrated: boolean;
  session: DemoSession | null;
  signIn: (role: UserRole) => DemoSession;
  signOut: () => void;
  updateSession: (updates: Partial<Pick<DemoSession, 'name' | 'email' | 'dormName'>>) => void;
}

const DemoSessionContext = createContext<DemoSessionContextValue | undefined>(undefined);

function persistSession(session: DemoSession | null) {
  if (typeof window === 'undefined') return;

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export default function DemoSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isHydrated: isWorkspaceHydrated, workspace } = useDemoWorkspace();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  function resolveRoleModules(role: UserRole, workspaceModules: EnabledModule[]): EnabledModule[] {
    const roleAllowedModules: Record<UserRole, EnabledModule[]> = {
      Admin: ['core', 'mealService', 'notifications', 'analytics', 'multiDorm'],
      Tenant: ['core', 'notifications', 'mealService'],
      Chef: ['core', 'notifications', 'mealService'],
    };

    return roleAllowedModules[role].filter((module) => module === 'core' || workspaceModules.includes(module));
  }

  function resolveHomePath(role: UserRole, enabledModules: EnabledModule[]) {
    if (role === 'Admin') return '/admin-dashboard';
    if (role === 'Tenant') return '/tenant-dashboard';
    return enabledModules.includes('mealService') ? '/chef-dashboard' : '/settings';
  }

  function syncSessionWithWorkspace(currentSession: DemoSession) {
    const nextEnabledModules = resolveRoleModules(currentSession.role, workspace.enabledModules);
    return {
      ...currentSession,
      enabledModules: nextEnabledModules,
      homePath: resolveHomePath(currentSession.role, nextEnabledModules),
    };
  }

  useEffect(() => {
    if (!isWorkspaceHydrated) return;

    const restored = restoreDemoSession(window.localStorage.getItem(SESSION_STORAGE_KEY));
    setSession(restored ? syncSessionWithWorkspace(restored) : null);
    setIsHydrated(true);
  }, [isWorkspaceHydrated, workspace.enabledModules]);

  useEffect(() => {
    if (!isWorkspaceHydrated) return;

    setSession((currentSession) => {
      if (!currentSession) return currentSession;

      const nextSession = syncSessionWithWorkspace(currentSession);
      persistSession(nextSession);
      return nextSession;
    });
  }, [isWorkspaceHydrated, workspace.enabledModules]);

  const value = useMemo<DemoSessionContextValue>(() => ({
    isHydrated,
    session,
    signIn: (role: UserRole) => {
      const nextSession = syncSessionWithWorkspace(createDemoSession(role));
      setSession(nextSession);
      persistSession(nextSession);
      return nextSession;
    },
    signOut: () => {
      setSession(null);
      persistSession(null);
    },
    updateSession: (updates) => {
      setSession((currentSession) => {
        if (!currentSession) return currentSession;

        const nextSession = { ...currentSession, ...updates };
        persistSession(nextSession);
        return nextSession;
      });
    },
  }), [isHydrated, session]);

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);

  if (!context) {
    throw new Error('useDemoSession must be used within DemoSessionProvider');
  }

  return context;
}
