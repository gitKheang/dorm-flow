'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import { createDemoAuthSeedSnapshot } from '@/lib/auth/demoService';
import {
  createAuthService,
  type AcceptInvitationInput,
  type CreateInvitationInput,
  type SignInInput,
} from '@/lib/auth/service';
import type {
  AuthMode,
  AuthStoreSnapshot,
  Dorm,
  Invitation,
  MembershipRole,
} from '@/lib/auth/types';
import {
  type DemoSession,
  getDefaultRoute,
  SESSION_STORAGE_KEY,
} from '@/lib/demoSession';

interface SignUpOwnerInput {
  fullName: string;
  email: string;
  password: string;
  dormName?: string;
}

interface DemoSessionContextValue {
  authMode: AuthMode;
  isHydrated: boolean;
  invitations: Invitation[];
  session: DemoSession | null;
  signIn: (input: SignInInput) => Promise<DemoSession>;
  signUpOwner: (input: SignUpOwnerInput) => Promise<DemoSession>;
  acceptInvitation: (input: AcceptInvitationInput) => Promise<DemoSession>;
  signOut: () => void;
  switchActiveDorm: (dormId: string) => DemoSession | null;
  ensureAdminMembershipForDorm: (dormId: string) => DemoSession | null;
  updateSession: (updates: Partial<Pick<DemoSession, 'name' | 'email'>>) => void;
  createInvitation: (input: Omit<CreateInvitationInput, 'dorm' | 'invitedByUserId'>) => Invitation;
}

const DemoSessionContext = createContext<DemoSessionContextValue | undefined>(undefined);

function persistSnapshot(snapshot: AuthStoreSnapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

function restoreSnapshot(): AuthStoreSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as AuthStoreSnapshot;
  } catch {
    return null;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function mapDormToAuthDorm(dorm: {
  id: string;
  name: string;
  city: string;
  address: string;
  timezone: string;
  status: 'Active' | 'Archived';
}): Dorm {
  return {
    id: dorm.id,
    name: dorm.name,
    city: dorm.city,
    address: dorm.address,
    timezone: dorm.timezone,
    status: dorm.status,
  };
}

export default function DemoSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    addDorm,
    currentDorm,
    isHydrated: isWorkspaceHydrated,
    setCurrentDorm,
    updateChefStatus,
    updateTenantStatus,
    workspace,
  } = useDemoWorkspace();
  const authService = useMemo(() => createAuthService(), []);
  const [authState, setAuthState] = useState<AuthStoreSnapshot | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const enabledModules = workspace.enabledModules;

  function resolveRoleModules(role: MembershipRole) {
    const roleAllowedModules: Record<MembershipRole, typeof enabledModules> = {
      Admin: ['core', 'mealService', 'notifications', 'analytics', 'multiDorm'],
      Tenant: ['core', 'notifications', 'mealService'],
      Chef: ['core', 'notifications', 'mealService'],
    };

    return roleAllowedModules[role].filter(
      (module) => module === 'core' || enabledModules.includes(module),
    );
  }

  function resolveSessionView(snapshot: AuthStoreSnapshot | null): DemoSession | null {
    if (!snapshot?.session) {
      return null;
    }

    const user = snapshot.users.find((candidate) => candidate.id === snapshot.session?.userId);
    const activeMembership = snapshot.memberships.find(
      (candidate) => candidate.id === snapshot.session?.activeMembershipId,
    );
    const activeDorm = snapshot.dorms.find((candidate) => candidate.id === snapshot.session?.activeDormId);

    if (!user || !activeMembership || !activeDorm) {
      return null;
    }

    const memberships = snapshot.memberships.filter(
      (candidate) => candidate.userId === user.id && candidate.status === 'active',
    );
    const tenantProfile = snapshot.tenantProfiles.find(
      (candidate) => candidate.membershipId === activeMembership.id,
    ) ?? null;
    const chefProfile = snapshot.chefProfiles.find(
      (candidate) => candidate.membershipId === activeMembership.id,
    ) ?? null;
    const modules = resolveRoleModules(activeMembership.role);
    const tenantRecord = tenantProfile
      ? workspace.tenants.find((tenant) => tenant.id === tenantProfile.tenantId)
      : undefined;
    const roomRecord = tenantRecord
      ? workspace.rooms.find((room) => room.id === tenantRecord.roomId)
      : undefined;

    return {
      ...snapshot.session,
      user,
      memberships,
      activeMembership,
      activeDorm,
      role: activeMembership.role,
      name: user.fullName,
      email: user.email,
      initials: user.initials,
      dormName: activeDorm.name,
      homePath: getDefaultRoute(activeMembership.role, modules),
      enabledModules: modules,
      tenantProfile,
      chefProfile,
      tenantId: tenantProfile?.tenantId,
      chefId: chefProfile?.chefId,
      roomNumber: roomRecord?.roomNumber,
    };
  }

  function commitSnapshot(nextSnapshot: AuthStoreSnapshot): DemoSession | null {
    persistSnapshot(nextSnapshot);
    setAuthState(nextSnapshot);
    return resolveSessionView(nextSnapshot);
  }

  useEffect(() => {
    if (!isWorkspaceHydrated) return;

    const seed = createDemoAuthSeedSnapshot({
      dorms: workspace.dorms.map(mapDormToAuthDorm),
      tenants: workspace.tenants,
      chefs: workspace.chefs,
    });
    const restored = restoreSnapshot();
    const initialSnapshot = authService.initialize(restored, seed);
    persistSnapshot(initialSnapshot);
    setAuthState(initialSnapshot);
    setIsHydrated(true);
  }, [authService, isWorkspaceHydrated]);

  useEffect(() => {
    if (!isHydrated || !isWorkspaceHydrated || !authState) return;

    const syncedSnapshot = authService.syncDorms(
      authState,
      workspace.dorms.map(mapDormToAuthDorm),
    );
    if (syncedSnapshot !== authState) {
      persistSnapshot(syncedSnapshot);
      setAuthState(syncedSnapshot);
    }
  }, [authService, authState, isHydrated, isWorkspaceHydrated, workspace.dorms]);

  const session = useMemo(() => resolveSessionView(authState), [authState, enabledModules, workspace.rooms, workspace.tenants]);

  useEffect(() => {
    if (!isHydrated || !authState?.session) return;

    const activeDormStillAvailable = workspace.dorms.some(
      (dorm) => dorm.id === authState.session?.activeDormId && dorm.status === 'Active',
    );

    if (activeDormStillAvailable) {
      return;
    }

    const fallbackMembership = authState.memberships.find(
      (membership) => membership.userId === authState.session?.userId
        && membership.status === 'active'
        && workspace.dorms.some((dorm) => dorm.id === membership.dormId && dorm.status === 'Active'),
    );

    if (!fallbackMembership) {
      commitSnapshot(authService.signOut(authState).snapshot);
      return;
    }

    commitSnapshot(
      authService.switchActiveDorm(authState, {
        userId: authState.session.userId,
        dormId: fallbackMembership.dormId,
      }).snapshot,
    );
  }, [authService, authState, isHydrated, workspace.dorms]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (currentDorm?.id !== session.activeDorm.id) {
      setCurrentDorm(session.activeDorm.id);
    }
  }, [currentDorm, session, setCurrentDorm]);

  const value = useMemo<DemoSessionContextValue>(() => ({
    authMode: authService.mode,
    isHydrated,
    invitations: authState?.invitations ?? [],
    session,
    signIn: async (input) => {
      if (!authState) {
        throw new Error('Auth is still loading.');
      }

      const result = authService.signIn(authState, {
        email: input.email.trim(),
        password: input.password,
      });
      const nextSession = commitSnapshot(result.snapshot);
      if (!nextSession) {
        throw new Error('Unable to start a session.');
      }
      return nextSession;
    },
    signUpOwner: async (input) => {
      if (!authState) {
        throw new Error('Auth is still loading.');
      }

      const normalizedEmail = normalizeEmail(input.email);
      const emailAlreadyExists = authState.users.some(
        (user) => normalizeEmail(user.email) === normalizedEmail,
      );
      if (emailAlreadyExists) {
        throw new Error('An account already exists for that email.');
      }

      const ownerName = input.fullName.trim();
      const dormName = input.dormName?.trim() || `${ownerName.split(' ')[0] || 'New'} Dorm`;
      const templateDorm = currentDorm ?? workspace.dorms[0];
      const nextDorm = addDorm({
        name: dormName,
        city: templateDorm?.city ?? 'Phnom Penh',
        address: templateDorm?.address ?? 'Add your dorm address in Settings',
        timezone: templateDorm?.timezone ?? 'UTC+7 (Indochina Time)',
        waitlist: 0,
      });

      const result = authService.signUpOwner(authState, {
        fullName: ownerName,
        email: normalizedEmail,
        password: input.password,
        dorm: mapDormToAuthDorm(nextDorm),
      });
      const nextSession = commitSnapshot(result.snapshot);
      if (!nextSession) {
        throw new Error('Unable to create the owner account.');
      }
      return nextSession;
    },
    acceptInvitation: async (input) => {
      if (!authState) {
        throw new Error('Auth is still loading.');
      }

      const invitation = authState.invitations.find(
        (candidate) => candidate.status === 'pending'
          && candidate.code === input.code.trim().toUpperCase()
          && normalizeEmail(candidate.email) === normalizeEmail(input.email),
      );

      const result = authService.acceptInvitation(authState, {
        ...input,
        email: normalizeEmail(input.email),
        fullName: input.fullName.trim(),
        code: input.code.trim().toUpperCase(),
      });

      if (invitation?.role === 'Tenant' && invitation.targetRecordId) {
        updateTenantStatus(invitation.targetRecordId, 'Active');
      }

      if (invitation?.role === 'Chef' && invitation.targetRecordId) {
        updateChefStatus(invitation.targetRecordId, 'Active');
      }

      const nextSession = commitSnapshot(result.snapshot);
      if (!nextSession) {
        throw new Error('Unable to accept the invitation.');
      }
      return nextSession;
    },
    signOut: () => {
      if (!authState) return;
      commitSnapshot(authService.signOut(authState).snapshot);
    },
    switchActiveDorm: (dormId) => {
      if (!authState?.session) return null;
      return commitSnapshot(
        authService.switchActiveDorm(authState, {
          userId: authState.session.userId,
          dormId,
        }).snapshot,
      );
    },
    ensureAdminMembershipForDorm: (dormId) => {
      if (!authState?.session) return null;
      const dorm = workspace.dorms.find((candidate) => candidate.id === dormId);
      if (!dorm) return null;

      const membershipSnapshot = authService.ensureOwnerMembership(authState, {
        userId: authState.session.userId,
        dorm: mapDormToAuthDorm(dorm),
      }).snapshot;

      return commitSnapshot(
        authService.switchActiveDorm(membershipSnapshot, {
          userId: authState.session.userId,
          dormId,
        }).snapshot,
      );
    },
    updateSession: (updates) => {
      if (!authState?.session) return;

      commitSnapshot(
        authService.updateUser(authState, {
          userId: authState.session.userId,
          fullName: updates.name,
          email: updates.email,
        }).snapshot,
      );
    },
    createInvitation: (input) => {
      if (!authState || !session || !currentDorm) {
        throw new Error('You must be signed in to invite people.');
      }

      const result = authService.createInvitation(authState, {
        ...input,
        email: normalizeEmail(input.email),
        dorm: mapDormToAuthDorm(currentDorm),
        invitedByUserId: session.user.id,
      });

      commitSnapshot(result.snapshot);
      if (!result.invitation) {
        throw new Error('Invitation could not be created.');
      }
      return result.invitation;
    },
  }), [
    addDorm,
    authService,
    authState,
    currentDorm,
    isHydrated,
    session,
    updateChefStatus,
    updateTenantStatus,
    workspace.dorms,
  ]);

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);

  if (!context) {
    throw new Error('useDemoSession must be used within DemoSessionProvider');
  }

  return context;
}

export function useAuthSession() {
  return useDemoSession();
}

export type { MembershipRole, DemoSession };
