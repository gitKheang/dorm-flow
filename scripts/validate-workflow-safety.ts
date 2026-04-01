import assert from 'node:assert/strict';
import { createDemoAuthSeedSnapshot } from '../src/lib/auth/demoService';
import { createAuthService } from '../src/lib/auth/service';
import type { AuthStoreSnapshot, MembershipRole } from '../src/lib/auth/types';
import {
  activateAcceptedInvitationTarget,
  createResidentWithInvitation,
  deleteRoomRecord,
  mapDormToAuthDorm,
  recordInvoicePaymentRecord,
  rejectInvoicePaymentRecord,
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
  tenantId?: string;
}): DemoSession {
  const { auth, dormId, role, tenantId, userEmail, workspace } = params;
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

  const tenantProfile = tenantId
    ? auth.tenantProfiles.find(
        (profile) =>
          profile.tenantId === tenantId &&
          profile.dormId === dormId &&
          profile.membershipId === activeMembership.id,
      ) ?? null
    : null;
  const roomNumber = tenantId
    ? workspace.rooms.find(
        (room) =>
          room.id === workspace.tenants.find((tenant) => tenant.id === tenantId)?.roomId,
      )?.roomNumber
    : undefined;

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
    homePath: role === 'Admin' ? '/admin-dashboard' : '/tenant-dashboard',
    tenantProfile,
    chefProfile: null,
    tenantId,
    enabledModules: [...DEFAULT_ENABLED_MODULES],
    roomNumber,
  };
}

function createBaseState() {
  const workspace = syncWorkspaceState(clone(DEFAULT_WORKSPACE_STATE));
  const auth = buildAuthSeed(workspace);
  const adminSession = buildSession({
    auth,
    workspace,
    role: 'Admin',
    userEmail: 'admin@sunrisedorm.app',
    dormId: workspace.currentDormId,
  });

  return {
    auth,
    adminSession,
    workspace,
  };
}

function runValidation() {
  const authService = createAuthService('demo');

  {
    const { adminSession, auth, workspace } = createBaseState();
    const firstInvite = createResidentWithInvitation({
      auth,
      authService,
      session: adminSession,
      workspace,
      input: {
        name: 'Pending One',
        email: 'pending.one@dormflow.app',
        phone: '+855-11-000-201',
        roomId: 'room-004',
      },
    });
    const secondInvite = createResidentWithInvitation({
      auth: firstInvite.auth,
      authService,
      session: adminSession,
      workspace: firstInvite.workspace,
      input: {
        name: 'Pending Two',
        email: 'pending.two@dormflow.app',
        phone: '+855-11-000-202',
        roomId: 'room-004',
      },
    });

    assert.equal(
      secondInvite.workspace.rooms.find((room) => room.id === 'room-004')?.occupants,
      2,
    );
    assert.throws(
      () =>
        createResidentWithInvitation({
          auth: secondInvite.auth,
          authService,
          session: adminSession,
          workspace: secondInvite.workspace,
          input: {
            name: 'Pending Three',
            email: 'pending.three@dormflow.app',
            phone: '+855-11-000-203',
            roomId: 'room-004',
          },
        }),
      /capacity/i,
    );
  }

  {
    const { adminSession, auth, workspace } = createBaseState();
    const inviteResult = createResidentWithInvitation({
      auth,
      authService,
      session: adminSession,
      workspace,
      input: {
        name: 'Room Drift',
        email: 'room.drift@dormflow.app',
        phone: '+855-11-000-204',
        roomId: 'room-004',
      },
    });

    const accepted = authService.acceptInvitation(inviteResult.auth, {
      fullName: 'Room Drift',
      email: 'room.drift@dormflow.app',
      password: 'RoomDrift2026',
      code: inviteResult.invitation!.code,
    });
    const driftedWorkspace = clone(inviteResult.workspace);
    driftedWorkspace.rooms = driftedWorkspace.rooms.map((room) =>
      room.id === 'room-004'
        ? { ...room, status: 'Under Maintenance' as const }
        : room,
    );
    const activated = syncWorkspaceState(
      activateAcceptedInvitationTarget(
        driftedWorkspace,
        accepted.invitation,
        'Room Drift',
      ),
    );
    const tenant = activated.tenants.find(
      (candidate) => candidate.id === inviteResult.value.id,
    );

    assert.equal(tenant?.status, 'Active');
    assert.equal(tenant?.roomId, 'unassigned');
  }

  {
    const { adminSession, auth, workspace } = createBaseState();
    const paymentWorkspace = syncWorkspaceState({
      ...workspace,
      payments: [],
    });
    const tenantSession = buildSession({
      auth,
      workspace,
      role: 'Tenant',
      userEmail: 'sophea.kang@dormflow.app',
      dormId: 'dorm-001',
      tenantId: 'tenant-001',
    });

    const submitted = recordInvoicePaymentRecord(paymentWorkspace, tenantSession, 'inv-001');
    assert.equal(
      submitted.payments.find((payment) => payment.invoiceId === 'inv-001')?.status,
      'pending',
    );
    assert.equal(
      submitted.invoices.find((invoice) => invoice.id === 'inv-001')?.status,
      'Issued',
    );

    const confirmed = recordInvoicePaymentRecord(submitted, adminSession, 'inv-001');
    assert.equal(
      confirmed.payments.find((payment) => payment.invoiceId === 'inv-001')?.status,
      'paid',
    );
    assert.equal(
      confirmed.invoices.find((invoice) => invoice.id === 'inv-001')?.status,
      'Paid',
    );
  }

  {
    const { adminSession, auth, workspace } = createBaseState();
    const paymentWorkspace = syncWorkspaceState({
      ...workspace,
      payments: [],
    });
    const tenantSession = buildSession({
      auth,
      workspace,
      role: 'Tenant',
      userEmail: 'sophea.kang@dormflow.app',
      dormId: 'dorm-001',
      tenantId: 'tenant-001',
    });

    const submitted = recordInvoicePaymentRecord(paymentWorkspace, tenantSession, 'inv-001');
    const rejected = rejectInvoicePaymentRecord(submitted, adminSession, 'inv-001');
    assert.equal(
      rejected.payments.find((payment) => payment.invoiceId === 'inv-001')?.status,
      'failed',
    );
    assert.equal(
      rejected.invoices.find((invoice) => invoice.id === 'inv-001')?.status,
      'Issued',
    );
  }

  {
    const { adminSession, auth, workspace } = createBaseState();
    assert.throws(
      () => deleteRoomRecord(workspace, adminSession, 'room-001'),
      /Move those residents first|history/i,
    );

    const archivedAuth = clone(auth);
    archivedAuth.dorms = archivedAuth.dorms.map((dorm) =>
      dorm.id === workspace.currentDormId
        ? { ...dorm, status: 'Archived' as const }
        : dorm,
    );

    assert.throws(
      () =>
        authService.createInvitation(archivedAuth, {
          dorm: mapDormToAuthDorm(
            workspace.dorms.find((dorm) => dorm.id === workspace.currentDormId)!,
          ),
          email: 'archived.invite@dormflow.app',
          role: 'Tenant',
          invitedByUserId: adminSession.user.id,
        }),
      /archived/i,
    );

    const liveInvite = createResidentWithInvitation({
      auth,
      authService,
      session: adminSession,
      workspace,
      input: {
        name: 'Archived Acceptance',
        email: 'archived.acceptance@dormflow.app',
        phone: '+855-11-000-205',
      },
    });
    const archivedInvitationSnapshot = clone(liveInvite.auth);
    archivedInvitationSnapshot.dorms = archivedInvitationSnapshot.dorms.map((dorm) =>
      dorm.id === workspace.currentDormId
        ? { ...dorm, status: 'Archived' as const }
        : dorm,
    );

    assert.throws(
      () =>
        authService.acceptInvitation(archivedInvitationSnapshot, {
          fullName: 'Archived Acceptance',
          email: 'archived.acceptance@dormflow.app',
          password: 'DormArchived2026',
          code: liveInvite.invitation!.code,
        }),
      /archived/i,
    );
  }

  console.log('Workflow safety validation passed.');
}

runValidation();
