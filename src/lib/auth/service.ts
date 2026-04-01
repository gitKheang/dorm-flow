import type {
  AuthMode,
  AuthSession,
  AuthStoreSnapshot,
  Dorm,
  Invitation,
  InvitationRole,
} from '@/lib/auth/types';
import { createDemoAuthService } from '@/lib/auth/demoService';
import { createSupabaseAuthService } from '@/lib/auth/supabaseService';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpOwnerInput {
  fullName: string;
  email: string;
  password: string;
  dorm: Dorm;
}

export interface AcceptInvitationInput {
  email: string;
  fullName: string;
  password: string;
  code: string;
}

export interface CreateInvitationInput {
  dorm: Dorm;
  email: string;
  role: InvitationRole;
  invitedByUserId: string;
  targetRecordId?: string;
}

export interface RevokeInvitationInput {
  invitationId: string;
  revokedByUserId: string;
}

export interface SwitchActiveDormInput {
  userId: string;
  dormId: string;
}

export interface UpdateUserInput {
  userId: string;
  fullName?: string;
  email?: string;
}

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  nextPassword: string;
}

export interface EnsureOwnerMembershipInput {
  userId: string;
  dorm: Dorm;
}

export interface AuthMutationResult {
  snapshot: AuthStoreSnapshot;
  session: AuthSession | null;
  invitation?: Invitation;
}

export interface AuthService {
  mode: AuthMode;
  initialize: (snapshot: AuthStoreSnapshot | null, seed: AuthStoreSnapshot) => AuthStoreSnapshot;
  syncDorms: (snapshot: AuthStoreSnapshot, dorms: Dorm[]) => AuthStoreSnapshot;
  signIn: (snapshot: AuthStoreSnapshot, input: SignInInput) => AuthMutationResult;
  signOut: (snapshot: AuthStoreSnapshot) => AuthMutationResult;
  signUpOwner: (snapshot: AuthStoreSnapshot, input: SignUpOwnerInput) => AuthMutationResult;
  acceptInvitation: (snapshot: AuthStoreSnapshot, input: AcceptInvitationInput) => AuthMutationResult;
  createInvitation: (snapshot: AuthStoreSnapshot, input: CreateInvitationInput) => AuthMutationResult;
  revokeInvitation: (snapshot: AuthStoreSnapshot, input: RevokeInvitationInput) => AuthMutationResult;
  switchActiveDorm: (snapshot: AuthStoreSnapshot, input: SwitchActiveDormInput) => AuthMutationResult;
  updateUser: (snapshot: AuthStoreSnapshot, input: UpdateUserInput) => AuthMutationResult;
  changePassword: (snapshot: AuthStoreSnapshot, input: ChangePasswordInput) => AuthMutationResult;
  ensureOwnerMembership: (snapshot: AuthStoreSnapshot, input: EnsureOwnerMembershipInput) => AuthMutationResult;
}

export function resolveConfiguredAuthMode(): AuthMode {
  const configured = process.env.NEXT_PUBLIC_AUTH_MODE;

  if (configured === 'supabase') {
    return 'supabase';
  }

  return 'demo';
}

export function createAuthService(mode: AuthMode = resolveConfiguredAuthMode()): AuthService {
  if (mode === 'supabase') {
    return createSupabaseAuthService();
  }

  return createDemoAuthService();
}
