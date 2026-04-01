import assert from 'node:assert/strict';
import { createDemoAuthSeedSnapshot } from '../src/lib/auth/demoService';
import { createAuthService } from '../src/lib/auth/service';
import type { AuthStoreSnapshot, MembershipRole } from '../src/lib/auth/types';
import {
  addDormToWorkspace,
  archiveDormRecord,
  mapDormToAuthDorm,
  syncWorkspaceState,
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

function buildSession(params: {
  auth: AuthStoreSnapshot;
  workspace: DemoWorkspaceState;
  role: MembershipRole;
  userEmail: string;
  dormId: string;
}): DemoSession {
  const { auth, dormId, role, userEmail, workspace } = params;
  const user = auth.users.find(
    (candidate) => candidate.email.toLowerCase() === userEmail.toLowerCase(),
  );
  const activeMembership = auth.memberships.find(
    (membership) =>
      membership.dormId === dormId &&
      membership.role === role &&
      membership.userId === user?.id,
  );
  const activeDorm = auth.dorms.find((dorm) => dorm.id === dormId);

  if (!user || !activeMembership || !activeDorm) {
    throw new Error(`Unable to build the ${role} session for validation.`);
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
    role,
    name: user.fullName,
    email: user.email,
    initials: user.initials,
    dormName: activeDorm.name,
    homePath: '/admin-dashboard',
    tenantProfile: null,
    chefProfile: null,
    tenantId: undefined,
    chefId: undefined,
    enabledModules: [...DEFAULT_ENABLED_MODULES],
  };
}

function runValidation() {
  const authService = createAuthService('demo');
  const workspace = syncWorkspaceState(clone(DEFAULT_WORKSPACE_STATE));
  const auth = buildAuthSeed(workspace);
  const adminSession = buildSession({
    auth,
    workspace,
    role: 'Admin',
    userEmail: 'admin@sunrisedorm.app',
    dormId: workspace.currentDormId,
  });

  const addedDormResult = addDormToWorkspace(workspace, adminSession, {
    name: 'Harbor House',
    city: 'Kampot',
    address: '22 Riverfront Road, Kampot',
    timezone: 'UTC+7 (Indochina Time)',
    waitlist: 4,
  });

  const syncedAuthSnapshot = authService.syncDorms(
    auth,
    addedDormResult.workspace.dorms.map(mapDormToAuthDorm),
  );
  const membershipSnapshot = authService.ensureOwnerMembership(
    syncedAuthSnapshot,
    {
      userId: adminSession.user.id,
      dorm: mapDormToAuthDorm(addedDormResult.value),
    },
  ).snapshot;
  const switchedToNewDorm = authService.switchActiveDorm(membershipSnapshot, {
    userId: adminSession.user.id,
    dormId: addedDormResult.value.id,
  }).snapshot;

  assert.ok(
    switchedToNewDorm.memberships.some(
      (membership) =>
        membership.userId === adminSession.user.id &&
        membership.dormId === addedDormResult.value.id &&
        membership.role === 'Admin',
    ),
    'Adding a dorm must grant the admin a usable membership.',
  );
  assert.equal(switchedToNewDorm.session?.activeDormId, addedDormResult.value.id);

  const newDormSession = buildSession({
    auth: switchedToNewDorm,
    workspace: addedDormResult.workspace,
    role: 'Admin',
    userEmail: 'admin@sunrisedorm.app',
    dormId: addedDormResult.value.id,
  });

  const archivedWorkspace = archiveDormRecord(
    addedDormResult.workspace,
    newDormSession,
    addedDormResult.value.id,
  );
  const archivedAuthSnapshot = authService.syncDorms(
    switchedToNewDorm,
    archivedWorkspace.dorms.map(mapDormToAuthDorm),
  );

  const fallbackDormId = archivedWorkspace.currentDormId;
  assert.notEqual(
    fallbackDormId,
    addedDormResult.value.id,
    'Archiving the active dorm must move the workspace to another active dorm.',
  );
  assert.equal(
    archivedWorkspace.dorms.find((dorm) => dorm.id === addedDormResult.value.id)?.status,
    'Archived',
  );

  const switchedToFallback = authService.switchActiveDorm(archivedAuthSnapshot, {
    userId: adminSession.user.id,
    dormId: fallbackDormId,
  }).snapshot;
  assert.equal(switchedToFallback.session?.activeDormId, fallbackDormId);
  assert.throws(
    () =>
      authService.switchActiveDorm(switchedToFallback, {
        userId: adminSession.user.id,
        dormId: addedDormResult.value.id,
      }),
    /archived/i,
  );
}

runValidation();
console.log('Multi-dorm validation passed.');
