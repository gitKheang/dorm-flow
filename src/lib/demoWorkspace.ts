import type { EnabledModule } from '@/lib/demoSession';
import type { Tenant } from '@/lib/mockData';
import { mockTenants } from '@/lib/mockData';

export type ChefShift = 'Morning' | 'Evening' | 'Split';
export type ChefStatus = 'Active' | 'Invited' | 'Inactive';
export type MealPlan = 'No Meal Plan' | 'Breakfast Only' | 'Half Board' | 'Full Board';

export interface ChefMember {
  id: string;
  name: string;
  email: string;
  shift: ChefShift;
  specialty: string;
  status: ChefStatus;
}

export interface TenantMealPreference {
  tenantId: string;
  plan: MealPlan;
  notes: string;
}

export interface DemoWorkspaceState {
  enabledModules: EnabledModule[];
  tenants: Tenant[];
  chefs: ChefMember[];
  tenantMealPreferences: TenantMealPreference[];
}

export const DEMO_WORKSPACE_STORAGE_KEY = 'dormflow-demo-workspace-v1';

export const DEFAULT_WORKSPACE_STATE: DemoWorkspaceState = {
  enabledModules: ['core', 'mealService', 'notifications', 'analytics', 'multiDorm'],
  tenants: mockTenants,
  chefs: [
    {
      id: 'chef-001',
      name: 'Chef Kim',
      email: 'chef.kim@sunrisedorm.app',
      shift: 'Morning',
      specialty: 'Dorm Meal Planning',
      status: 'Active',
    },
    {
      id: 'chef-002',
      name: 'Chef Dara',
      email: 'chef.dara@sunrisedorm.app',
      shift: 'Evening',
      specialty: 'Bulk Dinner Service',
      status: 'Invited',
    },
  ],
  tenantMealPreferences: [
    {
      tenantId: 'tenant-001',
      plan: 'Full Board',
      notes: 'Vegetarian meals on weekdays.',
    },
    {
      tenantId: 'tenant-003',
      plan: 'Breakfast Only',
      notes: 'Prefers early service before class.',
    },
    {
      tenantId: 'tenant-007',
      plan: 'Half Board',
      notes: 'Lunch and dinner preferred on weekdays.',
    },
  ],
};

function asEnabledModules(value: unknown): EnabledModule[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKSPACE_STATE.enabledModules];
  }

  const allowedModules: EnabledModule[] = ['core', 'mealService', 'notifications', 'analytics', 'multiDorm'];
  const filtered = value.filter((item): item is EnabledModule => allowedModules.includes(item as EnabledModule));
  return filtered.includes('core') ? filtered : ['core', ...filtered];
}

function asTenants(value: unknown): Tenant[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKSPACE_STATE.tenants];
  }

  return value.filter((item): item is Tenant => {
    if (!item || typeof item !== 'object') return false;
    const tenant = item as Partial<Tenant>;
    return (
      typeof tenant.id === 'string' &&
      typeof tenant.name === 'string' &&
      typeof tenant.email === 'string' &&
      typeof tenant.phone === 'string' &&
      typeof tenant.avatar === 'string' &&
      typeof tenant.roomId === 'string' &&
      typeof tenant.moveInDate === 'string' &&
      (tenant.status === 'Active' || tenant.status === 'Inactive')
    );
  });
}

function asChefs(value: unknown): ChefMember[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKSPACE_STATE.chefs];
  }

  return value.filter((item): item is ChefMember => {
    if (!item || typeof item !== 'object') return false;
    const chef = item as Partial<ChefMember>;
    return (
      typeof chef.id === 'string' &&
      typeof chef.name === 'string' &&
      typeof chef.email === 'string' &&
      (chef.shift === 'Morning' || chef.shift === 'Evening' || chef.shift === 'Split') &&
      typeof chef.specialty === 'string' &&
      (chef.status === 'Active' || chef.status === 'Invited' || chef.status === 'Inactive')
    );
  });
}

function asMealPreferences(value: unknown): TenantMealPreference[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKSPACE_STATE.tenantMealPreferences];
  }

  return value.filter((item): item is TenantMealPreference => {
    if (!item || typeof item !== 'object') return false;
    const preference = item as Partial<TenantMealPreference>;
    return (
      typeof preference.tenantId === 'string' &&
      typeof preference.notes === 'string' &&
      (
        preference.plan === 'No Meal Plan' ||
        preference.plan === 'Breakfast Only' ||
        preference.plan === 'Half Board' ||
        preference.plan === 'Full Board'
      )
    );
  });
}

export function restoreDemoWorkspace(rawValue: string | null): DemoWorkspaceState {
  if (!rawValue) {
    return {
      ...DEFAULT_WORKSPACE_STATE,
      enabledModules: [...DEFAULT_WORKSPACE_STATE.enabledModules],
      tenants: [...DEFAULT_WORKSPACE_STATE.tenants],
      chefs: [...DEFAULT_WORKSPACE_STATE.chefs],
      tenantMealPreferences: [...DEFAULT_WORKSPACE_STATE.tenantMealPreferences],
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<DemoWorkspaceState>;
    return {
      enabledModules: asEnabledModules(parsed.enabledModules),
      tenants: asTenants(parsed.tenants),
      chefs: asChefs(parsed.chefs),
      tenantMealPreferences: asMealPreferences(parsed.tenantMealPreferences),
    };
  } catch {
    return {
      ...DEFAULT_WORKSPACE_STATE,
      enabledModules: [...DEFAULT_WORKSPACE_STATE.enabledModules],
      tenants: [...DEFAULT_WORKSPACE_STATE.tenants],
      chefs: [...DEFAULT_WORKSPACE_STATE.chefs],
      tenantMealPreferences: [...DEFAULT_WORKSPACE_STATE.tenantMealPreferences],
    };
  }
}

export function isModuleEnabled(enabledModules: EnabledModule[], module: EnabledModule): boolean {
  if (module === 'core') {
    return true;
  }

  return enabledModules.includes(module);
}
