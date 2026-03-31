import type { EnabledModule } from '@/lib/modules';
import type {
  AuthSessionView,
  MembershipRole,
} from '@/lib/auth/types';

export type UserRole = MembershipRole;
export interface DemoSession extends AuthSessionView {
  enabledModules: EnabledModule[];
  roomNumber?: string;
}

export const SESSION_STORAGE_KEY = 'dormflow-auth-session-v3';

const ROUTE_ACCESS: Record<string, MembershipRole[]> = {
  '/admin-dashboard': ['Admin'],
  '/room-management': ['Admin'],
  '/tenants': ['Admin'],
  '/payments': ['Admin'],
  '/reports': ['Admin'],
  '/multi-dorm': ['Admin'],
  '/tenant-dashboard': ['Tenant'],
  '/invoices': ['Admin', 'Tenant'],
  '/maintenance': ['Admin', 'Tenant'],
  '/chef-dashboard': ['Chef'],
  '/notifications': ['Admin', 'Tenant', 'Chef'],
  '/settings': ['Admin', 'Tenant', 'Chef'],
};

const ROUTE_MODULE_REQUIREMENTS: Partial<Record<string, EnabledModule>> = {
  '/chef-dashboard': 'mealService',
  '/reports': 'analytics',
  '/multi-dorm': 'multiDorm',
  '/notifications': 'notifications',
};

export function isUserRole(value: string): value is MembershipRole {
  return value === 'Admin' || value === 'Tenant' || value === 'Chef';
}

export function getDefaultRoute(role: MembershipRole, enabledModules: EnabledModule[] = ['core']): string {
  if (role === 'Admin') return '/admin-dashboard';
  if (role === 'Tenant') return '/tenant-dashboard';
  return enabledModules.includes('mealService') ? '/chef-dashboard' : '/settings';
}

export function getRoleLabel(role: MembershipRole): string {
  if (role === 'Admin') return 'Dorm Owner';
  if (role === 'Tenant') return 'Tenant';
  return 'Chef';
}

export function isModuleAvailable(session: Pick<DemoSession, 'enabledModules'> | null, module: EnabledModule): boolean {
  if (!session) return false;
  if (module === 'core') return true;
  return session.enabledModules.includes(module);
}

export function getRequiredModuleForPath(pathname: string): EnabledModule | null {
  for (const [route, requiredModule] of Object.entries(ROUTE_MODULE_REQUIREMENTS)) {
    if (requiredModule && (pathname === route || pathname.startsWith(`${route}/`))) {
      return requiredModule;
    }
  }

  return null;
}

export function canAccessPath(pathname: string, session: DemoSession | null): boolean {
  if (!session || !session.activeMembership) {
    return false;
  }

  for (const [route, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      if (!allowedRoles.includes(session.activeMembership.role)) {
        return false;
      }

      const requiredModule = getRequiredModuleForPath(pathname);
      if (requiredModule && !isModuleAvailable(session, requiredModule)) {
        return false;
      }

      return true;
    }
  }

  return false;
}
