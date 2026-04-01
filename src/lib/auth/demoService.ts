import type { WorkspaceChef, WorkspaceTenant } from '@/lib/demoData';
import type {
  AuthSession,
  AuthStoreSnapshot,
  ChefProfile,
  DemoCredential,
  Dorm,
  Invitation,
  Membership,
  TenantProfile,
  User,
} from '@/lib/auth/types';
import type {
  AcceptInvitationInput,
  AuthMutationResult,
  AuthService,
  ChangePasswordInput,
  CreateInvitationInput,
  EnsureOwnerMembershipInput,
  RevokeInvitationInput,
  SignInInput,
  SignUpOwnerInput,
  SwitchActiveDormInput,
  UpdateUserInput,
} from '@/lib/auth/service';

interface DemoAuthSeedInput {
  dorms: Dorm[];
  tenants: WorkspaceTenant[];
  chefs: WorkspaceChef[];
}

const INVITATION_TTL_DAYS = 14;

function cloneSnapshot(snapshot: AuthStoreSnapshot): AuthStoreSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as AuthStoreSnapshot;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function createInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DF'
  );
}

function createInvitationCode(dormName: string): string {
  const prefix = dormName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4))
    .join('-') || 'DORM';

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function addDays(value: Date, days: number) {
  const nextValue = new Date(value);
  nextValue.setDate(nextValue.getDate() + days);
  return nextValue;
}

function getInvitationStatus(invitation: Invitation, now = new Date()): Invitation['status'] {
  if (invitation.status !== 'pending') {
    return invitation.status;
  }

  const expiresAt = new Date(invitation.expiresAt);
  if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()) {
    return 'expired';
  }

  return invitation.status;
}

function applyInvitationLifecycle(snapshot: AuthStoreSnapshot, now = new Date()) {
  let changed = false;
  const nextInvitations = snapshot.invitations.map((invitation) => {
    const nextStatus = getInvitationStatus(invitation, now);
    if (nextStatus === invitation.status) {
      return invitation;
    }

    changed = true;
    return {
      ...invitation,
      status: nextStatus,
      expiredAt: nextStatus === 'expired' ? now.toISOString() : invitation.expiredAt,
    };
  });

  if (!changed) {
    return snapshot;
  }

  return {
    ...snapshot,
    invitations: nextInvitations,
  };
}

function createSession(userId: string, membership: Membership): AuthSession {
  return {
    mode: 'demo',
    userId,
    activeMembershipId: membership.id,
    activeDormId: membership.dormId,
    signedInAt: new Date().toISOString(),
  };
}

function requireActiveDorm(
  snapshot: AuthStoreSnapshot,
  dormId: string,
  message: string,
) {
  const dorm = snapshot.dorms.find((candidate) => candidate.id === dormId);
  if (!dorm) {
    throw new Error('Dorm not found.');
  }

  if (dorm.status !== 'Active') {
    throw new Error(message);
  }

  return dorm;
}

function getUserMemberships(snapshot: AuthStoreSnapshot, userId: string): Membership[] {
  return snapshot.memberships.filter((membership) => membership.userId === userId && membership.status === 'active');
}

function getActiveMembershipForUser(snapshot: AuthStoreSnapshot, userId: string): Membership | null {
  const currentMembership = snapshot.session?.userId === userId
    ? snapshot.memberships.find((membership) => membership.id === snapshot.session?.activeMembershipId)
    : null;

  if (currentMembership && currentMembership.status === 'active') {
    return currentMembership;
  }

  const activeDormIds = new Set(
    snapshot.dorms.filter((dorm) => dorm.status === 'Active').map((dorm) => dorm.id),
  );

  return (
    getUserMemberships(snapshot, userId).find((membership) => activeDormIds.has(membership.dormId))
    ?? getUserMemberships(snapshot, userId)[0]
    ?? null
  );
}

function ensureUniqueUserEmail(snapshot: AuthStoreSnapshot, email: string, ignoreUserId?: string) {
  const normalizedEmail = normalizeEmail(email);
  const conflict = snapshot.users.find(
    (user) => normalizeEmail(user.email) === normalizedEmail && user.id !== ignoreUserId,
  );

  if (conflict) {
    throw new Error('An account already exists for that email.');
  }
}

function createOwnerMembershipForDorm(userId: string, dormId: string, createdAt: string): Membership {
  return {
    id: `membership-admin-${userId}-${dormId}`,
    userId,
    dormId,
    role: 'Admin',
    status: 'active',
    createdAt,
  };
}

export function createDemoAuthSeedSnapshot({
  dorms,
  tenants,
  chefs,
}: DemoAuthSeedInput): AuthStoreSnapshot {
  const now = new Date().toISOString();

  const adminUser: User = {
    id: 'user-admin-001',
    email: 'admin@sunrisedorm.app',
    fullName: 'Admin User',
    initials: 'AD',
    createdAt: now,
  };

  const users: User[] = [adminUser];
  const credentials: DemoCredential[] = [
    { userId: adminUser.id, password: 'SunriseAdmin2026' },
  ];
  const memberships: Membership[] = dorms.map((dorm) => createOwnerMembershipForDorm(adminUser.id, dorm.id, now));
  const tenantProfiles: TenantProfile[] = [];
  const chefProfiles: ChefProfile[] = [];
  const invitations: Invitation[] = [];

  tenants.forEach((tenant, index) => {
    if (tenant.invitationLifecycleState === 'pending') {
      const dormName = dorms.find((dorm) => dorm.id === tenant.dormId)?.name ?? tenant.name;
      invitations.push({
        id: `invitation-tenant-${tenant.id}`,
        dormId: tenant.dormId,
        email: tenant.email,
        role: 'Tenant',
        status: 'pending',
        code: createInvitationCode(dormName),
        invitedByUserId: adminUser.id,
        targetRecordId: tenant.id,
        createdAt: tenant.moveInDate,
        expiresAt: addDays(new Date(tenant.moveInDate), INVITATION_TTL_DAYS).toISOString(),
      });
      return;
    }

    const userId = `user-${tenant.id}`;
    const membershipId = `membership-${tenant.id}`;
    users.push({
      id: userId,
      email: tenant.email,
      fullName: tenant.name,
      initials: tenant.avatar || createInitials(tenant.name),
      createdAt: tenant.moveInDate,
    });
    credentials.push({
      userId,
      password: index === 0 ? 'TenantPass2026' : 'DormFlowTenant2026',
    });
    memberships.push({
      id: membershipId,
      userId,
      dormId: tenant.dormId,
      role: 'Tenant',
      status: 'active',
      createdAt: tenant.moveInDate,
    });
    tenantProfiles.push({
      id: `tenant-profile-${tenant.id}`,
      membershipId,
      dormId: tenant.dormId,
      tenantId: tenant.id,
      status: tenant.status === 'Active' ? 'Active' : 'Inactive',
    });
  });

  chefs.forEach((chef, index) => {
    if (chef.invitationLifecycleState === 'pending' || chef.status === 'Invited') {
      const dormName = dorms.find((dorm) => dorm.id === chef.dormId)?.name ?? chef.name;
      invitations.push({
        id: `invitation-chef-${chef.id}`,
        dormId: chef.dormId,
        email: chef.email,
        role: 'Chef',
        status: 'pending',
        code: createInvitationCode(dormName),
        invitedByUserId: adminUser.id,
        targetRecordId: chef.id,
        createdAt: now,
        expiresAt: addDays(new Date(now), INVITATION_TTL_DAYS).toISOString(),
      });
      return;
    }

    const userId = `user-${chef.id}`;
    const membershipId = `membership-${chef.id}`;
    users.push({
      id: userId,
      email: chef.email,
      fullName: chef.name,
      initials: createInitials(chef.name),
      createdAt: now,
    });
    credentials.push({
      userId,
      password: index === 0 ? 'ChefKitchen2026' : 'DormFlowChef2026',
    });
    memberships.push({
      id: membershipId,
      userId,
      dormId: chef.dormId,
      role: 'Chef',
      status: 'active',
      createdAt: now,
    });
    chefProfiles.push({
      id: `chef-profile-${chef.id}`,
      membershipId,
      dormId: chef.dormId,
      chefId: chef.id,
      status: chef.status,
    });
  });

  return {
    mode: 'demo',
    users,
    dorms,
    memberships,
    tenantProfiles,
    chefProfiles,
    invitations,
    credentials,
    session: null,
  };
}

function signIn(snapshot: AuthStoreSnapshot, input: SignInInput): AuthMutationResult {
  const normalizedEmail = normalizeEmail(input.email);
  const user = snapshot.users.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const credential = snapshot.credentials.find((candidate) => candidate.userId === user.id);
  if (!credential || credential.password !== input.password) {
    throw new Error('Invalid email or password.');
  }

  const activeMembership = getActiveMembershipForUser(snapshot, user.id);
  if (!activeMembership) {
    throw new Error('No active dorm membership was found for this account.');
  }

  const nextSnapshot = cloneSnapshot(snapshot);
  nextSnapshot.session = createSession(user.id, activeMembership);
  return { snapshot: nextSnapshot, session: nextSnapshot.session };
}

function signOut(snapshot: AuthStoreSnapshot): AuthMutationResult {
  const nextSnapshot = cloneSnapshot(snapshot);
  nextSnapshot.session = null;
  return { snapshot: nextSnapshot, session: null };
}

function signUpOwner(snapshot: AuthStoreSnapshot, input: SignUpOwnerInput): AuthMutationResult {
  ensureUniqueUserEmail(snapshot, input.email);

  const createdAt = new Date().toISOString();
  const nextSnapshot = cloneSnapshot(snapshot);
  const nextUser: User = {
    id: `user-owner-${Date.now()}`,
    email: input.email.trim(),
    fullName: input.fullName.trim(),
    initials: createInitials(input.fullName),
    createdAt,
  };
  const nextMembership = createOwnerMembershipForDorm(nextUser.id, input.dorm.id, createdAt);

  nextSnapshot.users.unshift(nextUser);
  nextSnapshot.credentials.unshift({ userId: nextUser.id, password: input.password });
  nextSnapshot.memberships.unshift(nextMembership);
  nextSnapshot.dorms = [input.dorm, ...nextSnapshot.dorms.filter((dorm) => dorm.id !== input.dorm.id)];
  nextSnapshot.session = createSession(nextUser.id, nextMembership);

  return { snapshot: nextSnapshot, session: nextSnapshot.session };
}

function createInvitation(snapshot: AuthStoreSnapshot, input: CreateInvitationInput): AuthMutationResult {
  const currentSnapshot = applyInvitationLifecycle(snapshot);
  requireActiveDorm(
    currentSnapshot,
    input.dorm.id,
    'Archived dorms cannot send new invitations.',
  );
  const normalizedEmail = normalizeEmail(input.email);
  const existingMembership = currentSnapshot.memberships.find((membership) => {
    const user = currentSnapshot.users.find((candidate) => candidate.id === membership.userId);
    return membership.dormId === input.dorm.id && user && normalizeEmail(user.email) === normalizedEmail;
  });

  if (existingMembership) {
    throw new Error('That email already has a membership in this dorm.');
  }

  const existingPendingInvitation = currentSnapshot.invitations.find(
    (invitation) => invitation.dormId === input.dorm.id
      && invitation.role === input.role
      && invitation.status === 'pending'
      && normalizeEmail(invitation.email) === normalizedEmail,
  );

  if (existingPendingInvitation) {
    throw new Error('A pending invitation already exists for that email.');
  }

  const nextSnapshot = cloneSnapshot(currentSnapshot);
  const createdAt = new Date();
  const invitation: Invitation = {
    id: `invitation-${Date.now()}`,
    dormId: input.dorm.id,
    email: normalizedEmail,
    role: input.role,
    status: 'pending',
    code: createInvitationCode(input.dorm.name),
    invitedByUserId: input.invitedByUserId,
    targetRecordId: input.targetRecordId,
    createdAt: createdAt.toISOString(),
    expiresAt: addDays(createdAt, INVITATION_TTL_DAYS).toISOString(),
  };

  nextSnapshot.invitations.unshift(invitation);
  return { snapshot: nextSnapshot, session: nextSnapshot.session, invitation };
}

function acceptInvitation(snapshot: AuthStoreSnapshot, input: AcceptInvitationInput): AuthMutationResult {
  const currentSnapshot = applyInvitationLifecycle(snapshot);
  const normalizedEmail = normalizeEmail(input.email);
  const invitation = currentSnapshot.invitations.find(
    (candidate) => candidate.status === 'pending'
      && candidate.code === input.code.trim().toUpperCase()
      && normalizeEmail(candidate.email) === normalizedEmail,
  );

  if (!invitation) {
    const knownInvitation = currentSnapshot.invitations.find(
      (candidate) => candidate.code === input.code.trim().toUpperCase()
        && normalizeEmail(candidate.email) === normalizedEmail,
    );

    if (knownInvitation?.status === 'accepted') {
      throw new Error('This invitation has already been used.');
    }

    if (knownInvitation?.status === 'revoked') {
      throw new Error('This invitation has been revoked.');
    }

    if (knownInvitation?.status === 'expired') {
      throw new Error('This invitation has expired.');
    }

    throw new Error('Invitation not found. Check the email and invite code.');
  }

  requireActiveDorm(
    currentSnapshot,
    invitation.dormId,
    'This dorm is archived and can no longer accept invitations.',
  );

  const nextSnapshot = cloneSnapshot(currentSnapshot);
  let user = nextSnapshot.users.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail);

  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      initials: createInitials(input.fullName),
      createdAt: new Date().toISOString(),
    };
    nextSnapshot.users.unshift(user);
  } else if (input.fullName.trim()) {
    user.fullName = input.fullName.trim();
    user.initials = createInitials(user.fullName);
  }

  const conflictingMembership = nextSnapshot.memberships.find(
    (membership) => membership.userId === user.id && membership.dormId === invitation.dormId,
  );
  if (conflictingMembership) {
    throw new Error('That account already has a membership in this dorm.');
  }

  const membership: Membership = {
    id: `membership-${Date.now()}`,
    userId: user.id,
    dormId: invitation.dormId,
    role: invitation.role,
    status: 'active',
    createdAt: new Date().toISOString(),
    invitationId: invitation.id,
  };

  nextSnapshot.memberships.unshift(membership);

  if (invitation.role === 'Tenant') {
    nextSnapshot.tenantProfiles.unshift({
      id: `tenant-profile-${Date.now()}`,
      membershipId: membership.id,
      dormId: invitation.dormId,
      tenantId: invitation.targetRecordId ?? `tenant-pending-${Date.now()}`,
      status: 'Active',
    });
  } else {
    nextSnapshot.chefProfiles.unshift({
      id: `chef-profile-${Date.now()}`,
      membershipId: membership.id,
      dormId: invitation.dormId,
      chefId: invitation.targetRecordId ?? `chef-pending-${Date.now()}`,
      status: 'Active',
    });
  }

  const credentialIndex = nextSnapshot.credentials.findIndex((candidate) => candidate.userId === user.id);
  if (credentialIndex >= 0) {
    // TODO: Real backends should never overwrite passwords during invite acceptance.
    nextSnapshot.credentials[credentialIndex].password = input.password;
  } else {
    nextSnapshot.credentials.unshift({ userId: user.id, password: input.password });
  }

  const invitationIndex = nextSnapshot.invitations.findIndex((candidate) => candidate.id === invitation.id);
  nextSnapshot.invitations[invitationIndex] = {
    ...nextSnapshot.invitations[invitationIndex],
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
  };

  nextSnapshot.session = createSession(user.id, membership);
  return { snapshot: nextSnapshot, session: nextSnapshot.session, invitation: nextSnapshot.invitations[invitationIndex] };
}

function revokeInvitation(snapshot: AuthStoreSnapshot, input: RevokeInvitationInput): AuthMutationResult {
  const currentSnapshot = applyInvitationLifecycle(snapshot);
  const invitation = currentSnapshot.invitations.find((candidate) => candidate.id === input.invitationId);
  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Only pending invitations can be revoked.');
  }

  const nextSnapshot = cloneSnapshot(currentSnapshot);
  const invitationIndex = nextSnapshot.invitations.findIndex((candidate) => candidate.id === input.invitationId);
  nextSnapshot.invitations[invitationIndex] = {
    ...nextSnapshot.invitations[invitationIndex],
    status: 'revoked',
    revokedAt: new Date().toISOString(),
    revokedByUserId: input.revokedByUserId,
  };

  return { snapshot: nextSnapshot, session: nextSnapshot.session, invitation: nextSnapshot.invitations[invitationIndex] };
}

function switchActiveDorm(snapshot: AuthStoreSnapshot, input: SwitchActiveDormInput): AuthMutationResult {
  requireActiveDorm(
    snapshot,
    input.dormId,
    'Archived dorms cannot be used as active workspaces.',
  );
  const membership = snapshot.memberships.find(
    (candidate) => candidate.userId === input.userId && candidate.dormId === input.dormId && candidate.status === 'active',
  );

  if (!membership) {
    throw new Error('No active membership exists for that dorm.');
  }

  const nextSnapshot = cloneSnapshot(snapshot);
  nextSnapshot.session = createSession(input.userId, membership);
  return { snapshot: nextSnapshot, session: nextSnapshot.session };
}

function updateUser(snapshot: AuthStoreSnapshot, input: UpdateUserInput): AuthMutationResult {
  const nextSnapshot = cloneSnapshot(snapshot);
  const userIndex = nextSnapshot.users.findIndex((candidate) => candidate.id === input.userId);

  if (userIndex < 0) {
    throw new Error('User not found.');
  }

  if (input.email) {
    ensureUniqueUserEmail(nextSnapshot, input.email, input.userId);
  }

  const currentUser = nextSnapshot.users[userIndex];
  const fullName = input.fullName?.trim() ? input.fullName.trim() : currentUser.fullName;
  nextSnapshot.users[userIndex] = {
    ...currentUser,
    fullName,
    email: input.email?.trim() ? input.email.trim() : currentUser.email,
    initials: createInitials(fullName),
  };

  return { snapshot: nextSnapshot, session: nextSnapshot.session };
}

function changePassword(snapshot: AuthStoreSnapshot, input: ChangePasswordInput): AuthMutationResult {
  const nextSnapshot = cloneSnapshot(snapshot);
  const user = nextSnapshot.users.find((candidate) => candidate.id === input.userId);

  if (!user) {
    throw new Error('User not found.');
  }

  const credentialIndex = nextSnapshot.credentials.findIndex(
    (candidate) => candidate.userId === input.userId,
  );
  if (credentialIndex < 0) {
    throw new Error('Password changes are not available for this account.');
  }

  if (nextSnapshot.credentials[credentialIndex].password !== input.currentPassword) {
    throw new Error('Current password is incorrect.');
  }

  if (input.currentPassword === input.nextPassword) {
    throw new Error('Choose a new password that is different from the current password.');
  }

  nextSnapshot.credentials[credentialIndex] = {
    ...nextSnapshot.credentials[credentialIndex],
    password: input.nextPassword,
  };

  return { snapshot: nextSnapshot, session: nextSnapshot.session };
}

function ensureOwnerMembership(snapshot: AuthStoreSnapshot, input: EnsureOwnerMembershipInput): AuthMutationResult {
  requireActiveDorm(
    snapshot,
    input.dorm.id,
    'Archived dorms cannot receive new owner memberships.',
  );
  const existingMembership = snapshot.memberships.find(
    (membership) => membership.userId === input.userId && membership.dormId === input.dorm.id,
  );

  if (existingMembership) {
    return { snapshot, session: snapshot.session };
  }

  const nextSnapshot = cloneSnapshot(snapshot);
  const nextMembership = createOwnerMembershipForDorm(input.userId, input.dorm.id, new Date().toISOString());
  nextSnapshot.memberships.unshift(nextMembership);

  return { snapshot: nextSnapshot, session: nextSnapshot.session };
}

function syncDorms(snapshot: AuthStoreSnapshot, dorms: Dorm[]): AuthStoreSnapshot {
  const sameDorms = JSON.stringify(snapshot.dorms) === JSON.stringify(dorms);
  if (sameDorms) {
    return snapshot;
  }

  return {
    ...snapshot,
    dorms: dorms.map((dorm) => ({ ...dorm })),
  };
}

export function createDemoAuthService(): AuthService {
  return {
    mode: 'demo',
    initialize: (snapshot, seed) => applyInvitationLifecycle(snapshot ? syncDorms(snapshot, seed.dorms) : seed),
    syncDorms,
    signIn,
    signOut,
    signUpOwner,
    acceptInvitation,
    createInvitation,
    revokeInvitation,
    switchActiveDorm,
    updateUser,
    changePassword,
    ensureOwnerMembership,
  };
}
