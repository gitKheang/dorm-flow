import type { AuthMutationResult, AuthService } from '@/lib/auth/service';
import type { AuthStoreSnapshot, Dorm } from '@/lib/auth/types';

function notImplemented(): never {
  throw new Error('Supabase auth mode is not implemented yet. Switch NEXT_PUBLIC_AUTH_MODE back to demo.');
}

export function createSupabaseAuthService(): AuthService {
  return {
    mode: 'supabase',
    initialize: (_snapshot: AuthStoreSnapshot | null, seed: AuthStoreSnapshot) => {
      // TODO: Replace the demo seed with server-provided auth state from Supabase.
      return seed;
    },
    syncDorms: (snapshot: AuthStoreSnapshot, _dorms: Dorm[]) => snapshot,
    signIn: (): AuthMutationResult => notImplemented(),
    signOut: (): AuthMutationResult => notImplemented(),
    signUpOwner: (): AuthMutationResult => notImplemented(),
    acceptInvitation: (): AuthMutationResult => notImplemented(),
    createInvitation: (): AuthMutationResult => notImplemented(),
    switchActiveDorm: (): AuthMutationResult => notImplemented(),
    updateUser: (): AuthMutationResult => notImplemented(),
    ensureOwnerMembership: (): AuthMutationResult => notImplemented(),
  };
}
