export type UserRole = 'Admin' | 'Tenant' | 'Chef';
export type EnabledModule = 'core' | 'mealService' | 'notifications' | 'analytics' | 'multiDorm';

export interface DemoSession {
  role: UserRole;
  name: string;
  email: string;
  initials: string;
  dormName: string;
  homePath: string;
  enabledModules: EnabledModule[];
  tenantId?: string;
  roomNumber?: string;
}

export const SESSION_STORAGE_KEY = 'dormflow-demo-session-v1';

export const DEMO_SESSIONS: Record<UserRole, DemoSession> = {
  Admin: {
    role: 'Admin',
    name: 'Admin User',
    email: 'admin@sunrisedorm.app',
    initials: 'AD',
    dormName: 'Sunrise Dormitory',
    homePath: '/admin-dashboard',
    enabledModules: ['core', 'mealService', 'notifications', 'analytics', 'multiDorm'],
  },
  Tenant: {
    role: 'Tenant',
    name: 'Sophea Kang',
    email: 'sophea.kang@dormflow.app',
    initials: 'SK',
    dormName: 'Sunrise Dormitory',
    homePath: '/tenant-dashboard',
    enabledModules: ['core', 'notifications'],
    tenantId: 'tenant-001',
    roomNumber: '101',
  },
  Chef: {
    role: 'Chef',
    name: 'Chef Kim',
    email: 'chef.kim@sunrisedorm.app',
    initials: 'CK',
    dormName: 'Sunrise Dormitory',
    homePath: '/chef-dashboard',
    enabledModules: ['core', 'mealService', 'notifications'],
  },
};

const ROUTE_ACCESS: Record<string, UserRole[]> = {
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

export function isUserRole(value: string): value is UserRole {
  return value === 'Admin' || value === 'Tenant' || value === 'Chef';
}

export function createDemoSession(role: UserRole): DemoSession {
  return { ...DEMO_SESSIONS[role], enabledModules: [...DEMO_SESSIONS[role].enabledModules] };
}

export function getDefaultRoute(role: UserRole): string {
  return DEMO_SESSIONS[role].homePath;
}

export function getRoleLabel(role: UserRole): string {
  if (role === 'Admin') return 'Dorm Owner';
  if (role === 'Tenant') return 'Tenant';
  return 'Chef';
}

export function isModuleAvailable(session: DemoSession | null, module: EnabledModule): boolean {
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
  if (!session) return false;

  for (const [route, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      if (!allowedRoles.includes(session.role)) {
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

export function restoreDemoSession(rawValue: string | null): DemoSession | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<DemoSession>;
    if (!parsed.role || !isUserRole(parsed.role)) {
      return null;
    }

    const base = createDemoSession(parsed.role);
    return {
      ...base,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : base.name,
      email: typeof parsed.email === 'string' && parsed.email.trim() ? parsed.email : base.email,
      dormName: typeof parsed.dormName === 'string' && parsed.dormName.trim() ? parsed.dormName : base.dormName,
    };
  } catch {
    return null;
  }
}
