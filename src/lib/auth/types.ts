export type AuthMode = 'demo' | 'supabase';
export type MembershipRole = 'Admin' | 'Tenant' | 'Chef';
export type MembershipStatus = 'active' | 'invited' | 'suspended';
export type InvitationRole = Extract<MembershipRole, 'Tenant' | 'Chef'>;
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface User {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  createdAt: string;
}

export interface Dorm {
  id: string;
  name: string;
  city: string;
  address: string;
  timezone: string;
  status: 'Active' | 'Archived';
}

export interface Membership {
  id: string;
  userId: string;
  dormId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
  invitationId?: string;
}

export interface TenantProfile {
  id: string;
  membershipId: string;
  dormId: string;
  tenantId: string;
  status: 'Pending' | 'Active' | 'Inactive';
}

export interface ChefProfile {
  id: string;
  membershipId: string;
  dormId: string;
  chefId: string;
  status: 'Invited' | 'Active' | 'Inactive';
}

export interface Invitation {
  id: string;
  dormId: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  code: string;
  invitedByUserId: string;
  targetRecordId?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  revokedByUserId?: string;
  expiredAt?: string;
}

export interface AuthSession {
  mode: AuthMode;
  userId: string;
  activeMembershipId: string;
  activeDormId: string;
  signedInAt: string;
}

export interface AuthSessionView extends AuthSession {
  user: User;
  memberships: Membership[];
  activeMembership: Membership;
  activeDorm: Dorm;
  role: MembershipRole;
  name: string;
  email: string;
  initials: string;
  dormName: string;
  homePath: string;
  tenantProfile: TenantProfile | null;
  chefProfile: ChefProfile | null;
  tenantId?: string;
  chefId?: string;
}

export interface DemoCredential {
  userId: string;
  password: string;
}

export interface AuthStoreSnapshot {
  mode: AuthMode;
  users: User[];
  dorms: Dorm[];
  memberships: Membership[];
  tenantProfiles: TenantProfile[];
  chefProfiles: ChefProfile[];
  invitations: Invitation[];
  credentials: DemoCredential[];
  session: AuthSession | null;
}
