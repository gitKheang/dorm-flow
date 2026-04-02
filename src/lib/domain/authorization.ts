import type { DemoSession } from '@/lib/demoSession';
import type { Membership, MembershipRole } from '@/lib/auth/types';
import type { DemoDorm, DemoWorkspaceState } from '@/lib/demoWorkspace';
import type { EnabledModule } from '@/lib/modules';
import { getDormModuleAccess } from '@/lib/demoWorkspace';
import { DomainError } from '@/lib/domain/errors';

function assertAuthenticated(session: DemoSession | null): asserts session is DemoSession {
  if (!session) {
    throw new DomainError('UNAUTHENTICATED', 'You must be signed in to perform this action.');
  }
}

export function requireDorm(workspace: DemoWorkspaceState, dormId: string): DemoDorm {
  const dorm = workspace.dorms.find((candidate) => candidate.id === dormId);
  if (!dorm) {
    throw new DomainError('DORM_NOT_FOUND', 'Dorm not found.');
  }

  if (dorm.status !== 'Active') {
    throw new DomainError('DORM_ARCHIVED', 'Archived dorms cannot be used as active workspaces.');
  }

  return dorm;
}

export function requireMembership(
  session: DemoSession | null,
  dormId: string,
  allowedRoles?: MembershipRole[],
): Membership {
  assertAuthenticated(session);

  const membership = session.memberships.find((candidate) => candidate.dormId === dormId);
  if (!membership) {
    throw new DomainError('FORBIDDEN', 'You do not have access to this dorm.');
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new DomainError('FORBIDDEN', 'You are not allowed to perform this action in this dorm.');
  }

  return membership;
}

export function requireDormAccess(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  dormId: string,
  allowedRoles?: MembershipRole[],
) {
  const dorm = requireDorm(workspace, dormId);
  const membership = requireMembership(session, dormId, allowedRoles);

  return { dorm, membership };
}

export function requireActiveDormAccess(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  allowedRoles?: MembershipRole[],
) {
  assertAuthenticated(session);
  return requireDormAccess(workspace, session, session.activeDorm.id, allowedRoles);
}

export function requireModuleEnabled(
  workspace: DemoWorkspaceState,
  dormId: string,
  module: EnabledModule,
) {
  if (module === 'core') {
    return;
  }

  const access = getDormModuleAccess(workspace, dormId, module);
  if (!access.allowed) {
    if (access.reason === 'plan') {
      throw new DomainError(
        'PREMIUM_UPGRADE_REQUIRED',
        `${module} requires the dorm to be on the Premium plan.`,
      );
    }

    throw new DomainError('MODULE_DISABLED', `${module} is disabled for this dorm.`);
  }
}
