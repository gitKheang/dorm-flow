'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { EnabledModule } from '@/lib/demoSession';
import type {
  ChefMember,
  ChefShift,
  DemoWorkspaceState,
  MealPlan,
  TenantMealPreference,
} from '@/lib/demoWorkspace';
import {
  DEMO_WORKSPACE_STORAGE_KEY,
  isModuleEnabled,
  restoreDemoWorkspace,
} from '@/lib/demoWorkspace';
import type { Tenant } from '@/lib/mockData';

interface AddTenantInput {
  name: string;
  email: string;
  phone: string;
  roomId?: string;
}

interface AddChefInput {
  name: string;
  email: string;
  specialty: string;
  shift: ChefShift;
}

interface DemoWorkspaceContextValue {
  isHydrated: boolean;
  workspace: DemoWorkspaceState;
  hasModule: (module: EnabledModule) => boolean;
  setModuleEnabled: (module: EnabledModule, enabled: boolean) => void;
  addTenant: (input: AddTenantInput) => Tenant;
  updateTenantStatus: (tenantId: string, status: Tenant['status']) => void;
  addChef: (input: AddChefInput) => ChefMember;
  updateChefStatus: (chefId: string, status: ChefMember['status']) => void;
  setTenantMealPreference: (tenantId: string, updates: Omit<TenantMealPreference, 'tenantId'>) => void;
}

const DemoWorkspaceContext = createContext<DemoWorkspaceContextValue | undefined>(undefined);

function persistWorkspace(workspace: DemoWorkspaceState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}

function createAvatar(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DF';
}

export default function DemoWorkspaceProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [workspace, setWorkspace] = useState<DemoWorkspaceState>(restoreDemoWorkspace(null));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restored = restoreDemoWorkspace(window.localStorage.getItem(DEMO_WORKSPACE_STORAGE_KEY));
    setWorkspace(restored);
    setIsHydrated(true);
  }, []);

  const value = useMemo<DemoWorkspaceContextValue>(() => ({
    isHydrated,
    workspace,
    hasModule: (module) => isModuleEnabled(workspace.enabledModules, module),
    setModuleEnabled: (module, enabled) => {
      if (module === 'core') return;

      setWorkspace((currentWorkspace) => {
        const nextModules = enabled
          ? Array.from(new Set([...currentWorkspace.enabledModules, module]))
          : currentWorkspace.enabledModules.filter((item) => item !== module);
        const nextWorkspace = { ...currentWorkspace, enabledModules: nextModules };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    addTenant: ({ name, email, phone, roomId }) => {
      const nextTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        name,
        email,
        phone,
        avatar: createAvatar(name),
        roomId: roomId ?? 'unassigned',
        moveInDate: '2026-04-01',
        status: 'Inactive',
      };

      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          tenants: [nextTenant, ...currentWorkspace.tenants],
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextTenant;
    },
    updateTenantStatus: (tenantId, status) => {
      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          tenants: currentWorkspace.tenants.map((tenant) =>
            tenant.id === tenantId ? { ...tenant, status } : tenant,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    addChef: ({ name, email, specialty, shift }) => {
      const nextChef: ChefMember = {
        id: `chef-${Date.now()}`,
        name,
        email,
        specialty,
        shift,
        status: 'Invited',
      };

      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          chefs: [nextChef, ...currentWorkspace.chefs],
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextChef;
    },
    updateChefStatus: (chefId, status) => {
      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          chefs: currentWorkspace.chefs.map((chef) =>
            chef.id === chefId ? { ...chef, status } : chef,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    setTenantMealPreference: (tenantId, updates) => {
      setWorkspace((currentWorkspace) => {
        const existingIndex = currentWorkspace.tenantMealPreferences.findIndex(
          (preference) => preference.tenantId === tenantId,
        );
        const nextPreferences = [...currentWorkspace.tenantMealPreferences];
        const nextPreference: TenantMealPreference = {
          tenantId,
          plan: updates.plan as MealPlan,
          notes: updates.notes,
        };

        if (existingIndex >= 0) {
          nextPreferences[existingIndex] = nextPreference;
        } else {
          nextPreferences.unshift(nextPreference);
        }

        const nextWorkspace = {
          ...currentWorkspace,
          tenantMealPreferences: nextPreferences,
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
  }), [isHydrated, workspace]);

  return <DemoWorkspaceContext.Provider value={value}>{children}</DemoWorkspaceContext.Provider>;
}

export function useDemoWorkspace() {
  const context = useContext(DemoWorkspaceContext);

  if (!context) {
    throw new Error('useDemoWorkspace must be used within DemoWorkspaceProvider');
  }

  return context;
}
