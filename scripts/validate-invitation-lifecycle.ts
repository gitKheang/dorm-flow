import assert from 'node:assert/strict';
import { createDemoAuthSeedSnapshot } from '../src/lib/auth/demoService';
import { createAuthService } from '../src/lib/auth/service';
import type { AuthStoreSnapshot } from '../src/lib/auth/types';
import {
  createChefWithInvitation,
  createResidentWithInvitation,
  mapDormToAuthDorm,
  reconcileWorkspaceInvitationLifecycle,
  syncWorkspaceState,
  updateChefStatusRecord,
  updateTenantStatusRecord,
} from '../src/lib/domain/workspaceActions';
import {
  DEFAULT_ENABLED_MODULES,
  DEFAULT_WORKSPACE_STATE,
  type DemoWorkspaceState,
} from '../src/lib/demoWorkspace';
import type { DemoSession } from '../src/lib/demoSession';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildAuthSeed(workspace: DemoWorkspaceState) {
  return createDemoAuthSeedSnapshot({
    dorms: workspace.dorms.map(mapDormToAuthDorm),
    tenants: workspace.tenants,
    chefs: workspace.chefs,
  });
}

function buildAdminSession(
  auth: AuthStoreSnapshot,
  workspace: DemoWorkspaceState,
): DemoSession {
  const user = auth.users.find((candidate) => candidate.id === 'user-admin-001');
  const activeMembership = auth.memberships.find(
    (membership) =>
      membership.userId === 'user-admin-001' &&
      membership.role === 'Admin' &&
      membership.dormId === workspace.currentDormId,
  );
  const activeDorm = auth.dorms.find(
    (dorm) => dorm.id === workspace.currentDormId,
  );

  if (!user || !activeMembership || !activeDorm) {
    throw new Error('Unable to build the admin session for invitation validation.');
  }

  return {
    mode: 'demo',
    userId: user.id,
    activeMembershipId: activeMembership.id,
    activeDormId: activeDorm.id,
    signedInAt: new Date().toISOString(),
    user,
    memberships: auth.memberships.filter(
      (membership) =>
        membership.userId === user.id && membership.status === 'active',
    ),
    activeMembership,
    activeDorm,
    role: 'Admin',
    name: user.fullName,
    email: user.email,
    initials: user.initials,
    dormName: activeDorm.name,
    homePath: '/admin-dashboard',
    tenantProfile: null,
    chefProfile: null,
    enabledModules: [...DEFAULT_ENABLED_MODULES],
  };
}

function createBaseState() {
  const workspace = syncWorkspaceState(clone(DEFAULT_WORKSPACE_STATE));
  const auth = buildAuthSeed(workspace);
  const adminSession = buildAdminSession(auth, workspace);

  return {
    workspace,
    auth,
    adminSession,
  };
}

function runValidation() {
  const authService = createAuthService('demo');

  {
    const { adminSession, auth, workspace } = createBaseState();
    const inviteResult = createResidentWithInvitation({
      auth,
      authService,
      session: adminSession,
      workspace,
      input: {
        name: 'Mina Student',
        email: 'mina.student@dormflow.app',
        phone: '+855-11-000-001',
        roomId: 'room-004',
      },
    });

    assert.equal(inviteResult.value.invitationLifecycleState, 'pending');
    assert.throws(
      () =>
        updateTenantStatusRecord(
          inviteResult.workspace,
          adminSession,
          inviteResult.value.id,
          'Active',
        ),
      /pending invitations/i,
    );

    const accepted = authService.acceptInvitation(inviteResult.auth, {
      fullName: 'Mina Student',
      email: 'mina.student@dormflow.app',
      password: 'TenantInvite2026',
      code: inviteResult.invitation!.code,
    });
    const acceptedWorkspace = reconcileWorkspaceInvitationLifecycle(
      inviteResult.workspace,
      accepted.snapshot,
    );
    const acceptedTenant = acceptedWorkspace.tenants.find(
      (tenant) => tenant.id === inviteResult.value.id,
    );

    assert.equal(accepted.snapshot.invitations[0]?.status, 'accepted');
    assert.equal(acceptedTenant?.status, 'Active');
    assert.equal(acceptedTenant?.invitationLifecycleState, undefined);
  }

  {
    const { adminSession, auth, workspace } = createBaseState();
    const inviteResult = createResidentWithInvitation({
      auth,
      authService,
      session: adminSession,
      workspace,
      input: {
        name: 'Nika Placeholder',
        email: 'nika.placeholder@dormflow.app',
        phone: '+855-11-000-002',
      },
    });
    const revoked = authService.revokeInvitation(inviteResult.auth, {
      invitationId: inviteResult.invitation!.id,
      revokedByUserId: adminSession.user.id,
    });
    const reconciledWorkspace = reconcileWorkspaceInvitationLifecycle(
      inviteResult.workspace,
      revoked.snapshot,
    );

    assert.equal(
      revoked.snapshot.invitations.find(
        (invitation) => invitation.id === inviteResult.invitation!.id,
      )?.status,
      'revoked',
    );
    assert.equal(
      reconciledWorkspace.tenants.some(
        (tenant) => tenant.id === inviteResult.value.id,
      ),
      false,
    );
  }

  {
    const { adminSession, auth, workspace } = createBaseState();
    const inviteResult = createChefWithInvitation({
      auth,
      authService,
      session: adminSession,
      workspace,
      input: {
        name: 'Chef Pending',
        email: 'chef.pending@dormflow.app',
        specialty: 'Dorm Suppers',
        shift: 'Evening',
      },
    });

    assert.equal(inviteResult.value.invitationLifecycleState, 'pending');
    assert.throws(
      () =>
        updateChefStatusRecord(
          inviteResult.workspace,
          adminSession,
          inviteResult.value.id,
          'Active',
        ),
      /pending invitations/i,
    );

    const expiredAuthSnapshot = clone(inviteResult.auth);
    const invitation = expiredAuthSnapshot.invitations.find(
      (candidate) => candidate.id === inviteResult.invitation!.id,
    );
    if (!invitation) {
      throw new Error('Expected the pending chef invitation to exist.');
    }

    invitation.expiresAt = new Date(Date.now() - 60_000).toISOString();
    const refreshedAuth = authService.initialize(
      expiredAuthSnapshot,
      buildAuthSeed(inviteResult.workspace),
    );
    const reconciledWorkspace = reconcileWorkspaceInvitationLifecycle(
      inviteResult.workspace,
      refreshedAuth,
    );

    assert.equal(
      refreshedAuth.invitations.find(
        (candidate) => candidate.id === inviteResult.invitation!.id,
      )?.status,
      'expired',
    );
    assert.equal(
      reconciledWorkspace.chefs.some((chef) => chef.id === inviteResult.value.id),
      false,
    );
  }

  console.log('Invitation lifecycle validation passed.');
}

runValidation();
