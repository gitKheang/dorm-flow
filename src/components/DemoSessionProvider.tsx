"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useDemoAppState } from "@/components/DemoAppProvider";
import {
  createDormRecord,
  activateAcceptedInvitationTarget,
  mapDormToAuthDorm,
  setWorkspaceActiveDorm,
  syncSessionProfileRecord,
  syncWorkspaceState,
} from "@/lib/domain/workspaceActions";
import { getDormAvailableModules } from "@/lib/demoWorkspace";
import {
  type AcceptInvitationInput,
  type SignInInput,
} from "@/lib/auth/service";
import type {
  AuthMode,
  AuthStoreSnapshot,
  AuthSessionView,
  Dorm,
  Invitation,
  MembershipRole,
} from "@/lib/auth/types";
import { type DemoSession, getDefaultRoute } from "@/lib/demoSession";

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
  revokeInvitation: (invitationId: string) => Invitation;
  signOut: () => void;
  switchActiveDorm: (dormId: string) => DemoSession | null;
  ensureAdminMembershipForDorm: (dormId: string) => DemoSession | null;
  updateSession: (
    updates: Partial<Pick<DemoSession, "name" | "email">>,
  ) => void;
  changePassword: (currentPassword: string, nextPassword: string) => void;
}

const DemoSessionContext = createContext<DemoSessionContextValue | undefined>(
  undefined,
);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function resolveRoleModules(
  role: MembershipRole,
  dormModules: ReturnType<typeof getDormAvailableModules>,
) {
  const roleAllowedModules: Record<MembershipRole, typeof dormModules> = {
    Admin: ["core", "mealService", "notifications", "analytics", "multiDorm"],
    Tenant: ["core", "notifications", "mealService"],
    Chef: ["core", "notifications", "mealService"],
  };

  return roleAllowedModules[role].filter(
    (module) => module === "core" || dormModules.includes(module),
  );
}

function resolveSessionView(
  authState: AuthStoreSnapshot | null,
  workspace: ReturnType<typeof useDemoAppState>["workspaceState"],
): DemoSession | null {
  if (!authState?.session) {
    return null;
  }

  const user = authState.users.find(
    (candidate) => candidate.id === authState.session?.userId,
  );
  const activeMembership = authState.memberships.find(
    (candidate) => candidate.id === authState.session?.activeMembershipId,
  );
  const activeDorm =
    workspace.dorms.find(
      (candidate) => candidate.id === authState.session?.activeDormId,
    ) ??
    authState.dorms.find(
      (candidate) => candidate.id === authState.session?.activeDormId,
    );

  if (
    !user ||
    !activeMembership ||
    !activeDorm ||
    activeDorm.status !== "Active"
  ) {
    return null;
  }

  const memberships = authState.memberships.filter(
    (candidate) =>
      candidate.userId === user.id && candidate.status === "active",
  );
  const tenantProfile =
    authState.tenantProfiles.find(
      (candidate) => candidate.membershipId === activeMembership.id,
    ) ?? null;
  const chefProfile =
    authState.chefProfiles.find(
      (candidate) => candidate.membershipId === activeMembership.id,
    ) ?? null;
  const dormModules = getDormAvailableModules(workspace, activeMembership.dormId);
  const modules = resolveRoleModules(activeMembership.role, dormModules);
  const tenantRecord = tenantProfile
    ? workspace.tenants.find((tenant) => tenant.id === tenantProfile.tenantId)
    : undefined;
  const roomRecord = tenantRecord
    ? workspace.rooms.find((room) => room.id === tenantRecord.roomId)
    : undefined;

  const sessionView: AuthSessionView = {
    ...authState.session,
    user,
    memberships,
    activeMembership,
    activeDorm: {
      id: activeDorm.id,
      name: activeDorm.name,
      city: activeDorm.city,
      address: activeDorm.address,
      timezone: activeDorm.timezone,
      status: activeDorm.status,
    } satisfies Dorm,
    role: activeMembership.role,
    name: user.fullName,
    email: user.email,
    initials: user.initials,
    dormName: activeDorm.name,
    homePath: getDefaultRoute(activeMembership.role, modules),
    tenantProfile,
    chefProfile,
    tenantId: tenantProfile?.tenantId,
    chefId: chefProfile?.chefId,
  };

  return {
    ...sessionView,
    enabledModules: modules,
    roomNumber: roomRecord?.roomNumber,
  };
}

export default function DemoSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { authService, authState, commitState, isHydrated, workspaceState } =
    useDemoAppState();

  const session = useMemo(
    () => resolveSessionView(authState, workspaceState),
    [authState, workspaceState],
  );

  useEffect(() => {
    if (!isHydrated || !authState?.session) {
      return;
    }

    const activeDormStillAvailable = workspaceState.dorms.some(
      (dorm) =>
        dorm.id === authState.session?.activeDormId && dorm.status === "Active",
    );
    if (activeDormStillAvailable) {
      if (workspaceState.currentDormId !== authState.session.activeDormId) {
        commitState({
          workspaceState: session
            ? setWorkspaceActiveDorm(
                workspaceState,
                session,
                authState.session.activeDormId,
              )
            : syncWorkspaceState({
                ...workspaceState,
                currentDormId: authState.session.activeDormId,
              }),
        });
      }
      return;
    }

    const fallbackMembership = authState.memberships.find(
      (membership) =>
        membership.userId === authState.session?.userId &&
        membership.status === "active" &&
        workspaceState.dorms.some(
          (dorm) => dorm.id === membership.dormId && dorm.status === "Active",
        ),
    );

    if (!fallbackMembership) {
      commitState({
        authState: authService.signOut(authState).snapshot,
      });
      return;
    }

    const switched = authService.switchActiveDorm(authState, {
      userId: authState.session.userId,
      dormId: fallbackMembership.dormId,
    });
    commitState({
      authState: switched.snapshot,
      workspaceState: syncWorkspaceState({
        ...workspaceState,
        currentDormId: fallbackMembership.dormId,
      }),
    });
  }, [
    authService,
    authState,
    commitState,
    isHydrated,
    session,
    workspaceState,
  ]);

  const value = useMemo<DemoSessionContextValue>(
    () => ({
      authMode: authService.mode,
      isHydrated,
      invitations: authState?.invitations ?? [],
      session,
      signIn: async (input) => {
        if (!authState) {
          throw new Error("Auth is still loading.");
        }

        const result = authService.signIn(authState, {
          email: normalizeEmail(input.email),
          password: input.password,
        });
        const nextWorkspaceState = result.session
          ? syncWorkspaceState({
              ...workspaceState,
              currentDormId: result.session.activeDormId,
            })
          : workspaceState;
        commitState({
          authState: result.snapshot,
          workspaceState: nextWorkspaceState,
        });

        const nextSession = resolveSessionView(
          result.snapshot,
          nextWorkspaceState,
        );
        if (!nextSession) {
          throw new Error("Unable to start a session.");
        }
        return nextSession;
      },
      signUpOwner: async (input) => {
        if (!authState) {
          throw new Error("Auth is still loading.");
        }

        const normalizedEmail = normalizeEmail(input.email);
        const emailAlreadyExists = authState.users.some(
          (user) => normalizeEmail(user.email) === normalizedEmail,
        );
        if (emailAlreadyExists) {
          throw new Error("An account already exists for that email.");
        }

        const ownerName = input.fullName.trim();
        const dormName =
          input.dormName?.trim() || `${ownerName.split(" ")[0] || "New"} Dorm`;
        const templateDorm =
          workspaceState.dorms.find((dorm) => dorm.status === "Active") ??
          workspaceState.dorms[0];
        const dormResult = createDormRecord(workspaceState, {
          name: dormName,
          city: templateDorm?.city ?? "Phnom Penh",
          address: templateDorm?.address ?? "Add your dorm address in Settings",
          timezone: templateDorm?.timezone ?? "UTC+7 (Indochina Time)",
          waitlist: 0,
        });
        const authResult = authService.signUpOwner(authState, {
          fullName: ownerName,
          email: normalizedEmail,
          password: input.password,
          dorm: mapDormToAuthDorm(dormResult.value),
        });

        commitState({
          authState: authResult.snapshot,
          workspaceState: dormResult.workspace,
        });

        const nextSession = resolveSessionView(
          authResult.snapshot,
          dormResult.workspace,
        );
        if (!nextSession) {
          throw new Error("Unable to create the owner account.");
        }
        return nextSession;
      },
      acceptInvitation: async (input) => {
        if (!authState) {
          throw new Error("Auth is still loading.");
        }

        const authResult = authService.acceptInvitation(authState, {
          ...input,
          email: normalizeEmail(input.email),
          fullName: input.fullName.trim(),
          code: input.code.trim().toUpperCase(),
        });
        const acceptedUserName =
          authResult.snapshot.users.find(
            (candidate) =>
              normalizeEmail(candidate.email) === normalizeEmail(input.email),
          )?.fullName ?? input.fullName.trim();
        const invitedDormId =
          authResult.invitation?.dormId ?? authResult.session?.activeDormId;
        const nextWorkspaceState = syncWorkspaceState({
          ...activateAcceptedInvitationTarget(
            workspaceState,
            authResult.invitation,
            acceptedUserName,
          ),
          currentDormId: invitedDormId ?? workspaceState.currentDormId,
        });

        commitState({
          authState: authResult.snapshot,
          workspaceState: nextWorkspaceState,
        });

        const nextSession = resolveSessionView(
          authResult.snapshot,
          nextWorkspaceState,
        );
        if (!nextSession) {
          throw new Error("Unable to accept the invitation.");
        }
        return nextSession;
      },
      revokeInvitation: (invitationId) => {
        if (!authState || !session) {
          throw new Error("Auth is still loading.");
        }

        if (session.role !== "Admin") {
          throw new Error("Only dorm owners can revoke invitations.");
        }

        const result = authService.revokeInvitation(authState, {
          invitationId,
          revokedByUserId: session.user.id,
        });
        commitState({
          authState: result.snapshot,
        });
        if (!result.invitation) {
          throw new Error("Invitation could not be revoked.");
        }

        return result.invitation;
      },
      signOut: () => {
        if (!authState) return;
        commitState({
          authState: authService.signOut(authState).snapshot,
        });
      },
      switchActiveDorm: (dormId) => {
        if (!authState?.session || !session) return null;

        const nextDorm = workspaceState.dorms.find(
          (candidate) => candidate.id === dormId,
        );
        if (!nextDorm || nextDorm.status !== "Active") {
          throw new Error(
            "Archived dorms cannot be used as active workspaces.",
          );
        }

        const switched = authService.switchActiveDorm(authState, {
          userId: authState.session.userId,
          dormId,
        });
        const nextWorkspaceState = syncWorkspaceState({
          ...workspaceState,
          currentDormId: dormId,
        });

        commitState({
          authState: switched.snapshot,
          workspaceState: nextWorkspaceState,
        });
        return resolveSessionView(switched.snapshot, nextWorkspaceState);
      },
      ensureAdminMembershipForDorm: (dormId) => {
        if (!authState?.session || !session) return null;
        const dorm = workspaceState.dorms.find(
          (candidate) => candidate.id === dormId,
        );
        if (!dorm) return null;

        const syncedAuthState = authService.syncDorms(
          authState,
          workspaceState.dorms.map(mapDormToAuthDorm),
        );
        const membershipSnapshot = authService.ensureOwnerMembership(
          syncedAuthState,
          {
            userId: authState.session.userId,
            dorm: mapDormToAuthDorm(dorm),
          },
        ).snapshot;
        const switched = authService.switchActiveDorm(membershipSnapshot, {
          userId: authState.session.userId,
          dormId,
        });
        const nextWorkspaceState = syncWorkspaceState({
          ...workspaceState,
          currentDormId: dormId,
        });

        commitState({
          authState: switched.snapshot,
          workspaceState: nextWorkspaceState,
        });
        return resolveSessionView(switched.snapshot, nextWorkspaceState);
      },
      updateSession: (updates) => {
        if (!authState?.session || !session) return;

        const updated = authService.updateUser(authState, {
          userId: authState.session.userId,
          fullName: updates.name,
          email: updates.email,
        });
        commitState({
          authState: updated.snapshot,
          workspaceState: syncSessionProfileRecord(workspaceState, session, {
            name: updates.name,
            email: updates.email,
          }),
        });
      },
      changePassword: (currentPassword, nextPassword) => {
        if (!authState?.session) {
          throw new Error("Auth is still loading.");
        }

        const updated = authService.changePassword(authState, {
          userId: authState.session.userId,
          currentPassword,
          nextPassword,
        });
        commitState({
          authState: updated.snapshot,
        });
      },
    }),
    [authService, authState, commitState, isHydrated, session, workspaceState],
  );

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);

  if (!context) {
    throw new Error("useDemoSession must be used within DemoSessionProvider");
  }

  return context;
}

export function useAuthSession() {
  return useDemoSession();
}

export type { MembershipRole, DemoSession };
