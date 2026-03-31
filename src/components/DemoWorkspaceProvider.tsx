'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { EnabledModule } from '@/lib/modules';
import type {
  ChefMember,
  ChefShift,
  DemoDorm,
  DemoWorkspaceState,
  MealItemRecord,
  MealPlan,
  TenantMealPreference,
  WorkspaceActivityRecord,
  WorkspaceInvoiceRecord,
  WorkspaceMaintenanceRecord,
  WorkspaceRoomRecord,
  WorkspaceTenantRecord,
} from '@/lib/demoWorkspace';
import {
  DEFAULT_WORKSPACE_STATE,
  DEMO_WORKSPACE_STORAGE_KEY,
  isModuleEnabled,
  restoreDemoWorkspace,
} from '@/lib/demoWorkspace';
import type { MaintenancePriority, MaintenanceStatus, Room, RoomStatus, Tenant } from '@/lib/mockData';

interface AddDormInput {
  name: string;
  city: string;
  address: string;
  timezone: string;
  waitlist?: number;
}

interface UpdateDormInput {
  name?: string;
  city?: string;
  address?: string;
  timezone?: string;
  waitlist?: number;
  status?: DemoDorm['status'];
}

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

interface AddMaintenanceTicketInput {
  title: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  description: string;
  category: string;
  priority?: MaintenancePriority;
}

interface AddMealInput {
  name: string;
  category: MealItemRecord['category'];
  day: string;
  servings: number;
  calories: number;
}

interface DemoWorkspaceContextValue {
  isHydrated: boolean;
  workspace: DemoWorkspaceState;
  currentDorm: DemoDorm | null;
  currentDormRooms: WorkspaceRoomRecord[];
  currentDormTenants: WorkspaceTenantRecord[];
  currentDormChefs: ChefMember[];
  currentDormInvoices: WorkspaceInvoiceRecord[];
  currentDormMaintenanceTickets: WorkspaceMaintenanceRecord[];
  currentDormActivityFeed: WorkspaceActivityRecord[];
  currentDormMeals: MealItemRecord[];
  hasModule: (module: EnabledModule) => boolean;
  setModuleEnabled: (module: EnabledModule, enabled: boolean) => void;
  setCurrentDorm: (dormId: string) => void;
  addDorm: (input: AddDormInput) => DemoDorm;
  updateDorm: (dormId: string, updates: UpdateDormInput) => void;
  archiveDorm: (dormId: string) => boolean;
  addTenant: (input: AddTenantInput) => Tenant;
  updateTenantStatus: (tenantId: string, status: Tenant['status']) => void;
  addChef: (input: AddChefInput) => ChefMember;
  updateChefStatus: (chefId: string, status: ChefMember['status']) => void;
  addRoom: (room: Room) => WorkspaceRoomRecord;
  updateRoom: (room: Room) => WorkspaceRoomRecord;
  deleteRoom: (roomId: string) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  generateInvoices: (period?: string) => number;
  addMaintenanceTicket: (input: AddMaintenanceTicketInput) => WorkspaceMaintenanceRecord;
  updateMaintenanceStatus: (ticketId: string, status: MaintenanceStatus) => void;
  setTenantMealPreference: (tenantId: string, updates: Omit<TenantMealPreference, 'tenantId'>) => void;
  addMeal: (input: AddMealInput) => MealItemRecord;
  updateMealStatus: (mealId: string, status: MealItemRecord['status']) => void;
  deleteMeal: (mealId: string) => void;
}

const DemoWorkspaceContext = createContext<DemoWorkspaceContextValue | undefined>(undefined);

function persistWorkspace(workspace: DemoWorkspaceState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}

function createAvatar(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DF'
  );
}

function syncRoomsWithTenants(rooms: WorkspaceRoomRecord[], tenants: WorkspaceTenantRecord[]) {
  return rooms.map((room) => {
    const assignedActiveTenants = tenants
      .filter((tenant) => tenant.roomId === room.id && tenant.status === 'Active')
      .map((tenant) => tenant.name);

    let nextStatus = room.status;
    if (room.status !== 'Under Maintenance' && room.status !== 'Reserved') {
      nextStatus = assignedActiveTenants.length > 0 ? 'Occupied' : 'Available';
    }

    return {
      ...room,
      occupants: assignedActiveTenants.length,
      assignedTenants: assignedActiveTenants,
      status: nextStatus,
    };
  });
}

function appendActivityItem(
  items: WorkspaceActivityRecord[],
  dormId: string,
  type: WorkspaceActivityRecord['type'],
  message: string,
  actor: string,
  meta?: string,
) {
  return [
    {
      id: `act-${Date.now()}`,
      dormId,
      type,
      message,
      actor,
      timestamp: new Date().toISOString(),
      meta,
    },
    ...items,
  ].slice(0, 20);
}

function getNextActiveDormId(dorms: DemoDorm[], currentDormId: string) {
  return dorms.find((dorm) => dorm.status === 'Active' && dorm.id !== currentDormId)?.id
    ?? dorms.find((dorm) => dorm.status === 'Active')?.id
    ?? currentDormId;
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

  const currentDorm = useMemo(
    () => workspace.dorms.find((dorm) => dorm.id === workspace.currentDormId && dorm.status === 'Active')
      ?? workspace.dorms.find((dorm) => dorm.status === 'Active')
      ?? null,
    [workspace.currentDormId, workspace.dorms],
  );

  const currentDormRooms = useMemo(
    () => workspace.rooms.filter((room) => room.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.rooms],
  );

  const currentDormTenants = useMemo(
    () => workspace.tenants.filter((tenant) => tenant.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.tenants],
  );

  const currentDormChefs = useMemo(
    () => workspace.chefs.filter((chef) => chef.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.chefs],
  );

  const currentDormInvoices = useMemo(
    () => workspace.invoices.filter((invoice) => invoice.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.invoices],
  );

  const currentDormMaintenanceTickets = useMemo(
    () => workspace.maintenanceTickets.filter((ticket) => ticket.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.maintenanceTickets],
  );

  const currentDormActivityFeed = useMemo(
    () => workspace.activityFeed.filter((item) => item.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.activityFeed],
  );

  const currentDormMeals = useMemo(
    () => workspace.mealItems.filter((meal) => meal.dormId === currentDorm?.id),
    [currentDorm?.id, workspace.mealItems],
  );

  const value = useMemo<DemoWorkspaceContextValue>(() => ({
    isHydrated,
    workspace,
    currentDorm,
    currentDormRooms,
    currentDormTenants,
    currentDormChefs,
    currentDormInvoices,
    currentDormMaintenanceTickets,
    currentDormActivityFeed,
    currentDormMeals,
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
    setCurrentDorm: (dormId) => {
      setWorkspace((currentWorkspace) => {
        if (!currentWorkspace.dorms.some((dorm) => dorm.id === dormId && dorm.status === 'Active')) {
          return currentWorkspace;
        }

        const nextWorkspace = { ...currentWorkspace, currentDormId: dormId };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    addDorm: ({ name, city, address, timezone, waitlist = 0 }) => {
      const nextDorm: DemoDorm = {
        id: `dorm-${Date.now()}`,
        name,
        city,
        address,
        timezone,
        waitlist,
        status: 'Active',
        openedOn: '2026-03-31',
      };

      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          currentDormId: nextDorm.id,
          dorms: [nextDorm, ...currentWorkspace.dorms],
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextDorm;
    },
    updateDorm: (dormId, updates) => {
      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          dorms: currentWorkspace.dorms.map((dorm) => (
            dorm.id === dormId ? { ...dorm, ...updates } : dorm
          )),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    archiveDorm: (dormId) => {
      let archived = false;

      setWorkspace((currentWorkspace) => {
        const activeDorms = currentWorkspace.dorms.filter((dorm) => dorm.status === 'Active');
        if (activeDorms.length <= 1) {
          return currentWorkspace;
        }

        archived = true;
        const nextDorms = currentWorkspace.dorms.map((dorm) => (
          dorm.id === dormId ? { ...dorm, status: 'Archived' as const } : dorm
        ));
        const nextWorkspace = {
          ...currentWorkspace,
          dorms: nextDorms,
          currentDormId: currentWorkspace.currentDormId === dormId
            ? getNextActiveDormId(nextDorms, dormId)
            : currentWorkspace.currentDormId,
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return archived;
    },
    addTenant: ({ name, email, phone, roomId }) => {
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;
      const nextTenant: WorkspaceTenantRecord = {
        id: `tenant-${Date.now()}`,
        dormId: targetDormId,
        name,
        email,
        phone,
        avatar: createAvatar(name),
        roomId: roomId ?? 'unassigned',
        moveInDate: '2026-04-01',
        status: 'Inactive',
      };

      setWorkspace((currentWorkspace) => {
        const nextTenants = [nextTenant, ...currentWorkspace.tenants];
        const nextRooms = syncRoomsWithTenants(currentWorkspace.rooms, nextTenants);
        const nextWorkspace = {
          ...currentWorkspace,
          tenants: nextTenants,
          rooms: nextRooms,
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetDormId,
            'assignment',
            `${nextTenant.name} added to resident pipeline`,
            'Admin',
            roomId && roomId !== 'unassigned' ? `Room assigned` : 'Assignment pending',
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextTenant;
    },
    updateTenantStatus: (tenantId, status) => {
      setWorkspace((currentWorkspace) => {
        const targetTenant = currentWorkspace.tenants.find((tenant) => tenant.id === tenantId);
        if (!targetTenant) {
          return currentWorkspace;
        }

        const nextTenants = currentWorkspace.tenants.map((tenant) => (
          tenant.id === tenantId ? { ...tenant, status } : tenant
        ));
        const nextRooms = syncRoomsWithTenants(currentWorkspace.rooms, nextTenants);
        const nextWorkspace = {
          ...currentWorkspace,
          tenants: nextTenants,
          rooms: nextRooms,
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetTenant.dormId,
            'assignment',
            `${targetTenant.name} marked ${status.toLowerCase()}`,
            'Admin',
            targetTenant.roomId !== 'unassigned' ? `Room ${nextRooms.find((room) => room.id === targetTenant.roomId)?.roomNumber ?? 'pending'}` : 'No room assigned',
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    addChef: ({ name, email, specialty, shift }) => {
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;
      const nextChef: ChefMember = {
        id: `chef-${Date.now()}`,
        dormId: targetDormId,
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
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetDormId,
            'assignment',
            `${nextChef.name} invited to kitchen team`,
            'Admin',
            nextChef.shift,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextChef;
    },
    updateChefStatus: (chefId, status) => {
      setWorkspace((currentWorkspace) => {
        const targetChef = currentWorkspace.chefs.find((chef) => chef.id === chefId);
        if (!targetChef) {
          return currentWorkspace;
        }

        const nextWorkspace = {
          ...currentWorkspace,
          chefs: currentWorkspace.chefs.map((chef) => (
            chef.id === chefId ? { ...chef, status } : chef
          )),
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetChef.dormId,
            'assignment',
            `${targetChef.name} status changed to ${status}`,
            'Admin',
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    addRoom: (room) => {
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;
      const nextRoom: WorkspaceRoomRecord = {
        ...room,
        dormId: targetDormId,
        occupants: 0,
        assignedTenants: [],
      };

      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          rooms: syncRoomsWithTenants([nextRoom, ...currentWorkspace.rooms], currentWorkspace.tenants),
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetDormId,
            'room',
            `Room ${nextRoom.roomNumber} added`,
            'Admin',
            nextRoom.type,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextRoom;
    },
    updateRoom: (room) => {
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;
      const nextRoom: WorkspaceRoomRecord = {
        ...room,
        dormId: targetDormId,
      };

      setWorkspace((currentWorkspace) => {
        const nextRooms = currentWorkspace.rooms.map((existingRoom) => (
          existingRoom.id === room.id ? nextRoom : existingRoom
        ));
        const nextWorkspace = {
          ...currentWorkspace,
          rooms: syncRoomsWithTenants(nextRooms, currentWorkspace.tenants),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextRoom;
    },
    deleteRoom: (roomId) => {
      setWorkspace((currentWorkspace) => {
        const targetRoom = currentWorkspace.rooms.find((room) => room.id === roomId);
        if (!targetRoom) {
          return currentWorkspace;
        }

        const nextWorkspace = {
          ...currentWorkspace,
          rooms: currentWorkspace.rooms.filter((room) => room.id !== roomId),
          tenants: currentWorkspace.tenants.map((tenant) => (
            tenant.roomId === roomId ? { ...tenant, roomId: 'unassigned' } : tenant
          )),
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetRoom.dormId,
            'room',
            `Room ${targetRoom.roomNumber} removed`,
            'Admin',
          ),
        };
        nextWorkspace.rooms = syncRoomsWithTenants(nextWorkspace.rooms, nextWorkspace.tenants);
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    updateRoomStatus: (roomId, status) => {
      setWorkspace((currentWorkspace) => {
        const targetRoom = currentWorkspace.rooms.find((room) => room.id === roomId);
        if (!targetRoom) {
          return currentWorkspace;
        }

        const nextRooms = currentWorkspace.rooms.map((room) => (
          room.id === roomId ? { ...room, status, lastUpdated: '2026-03-31' } : room
        ));
        const nextWorkspace = {
          ...currentWorkspace,
          rooms: syncRoomsWithTenants(nextRooms, currentWorkspace.tenants),
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetRoom.dormId,
            'room',
            `Room ${targetRoom.roomNumber} status updated`,
            'Admin',
            status,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    generateInvoices: (period = 'May 2026') => {
      let createdCount = 0;
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;

      setWorkspace((currentWorkspace) => {
        const activeDormTenants = currentWorkspace.tenants.filter((tenant) => tenant.dormId === targetDormId && tenant.status === 'Active');
        const newInvoices: WorkspaceInvoiceRecord[] = [];

        activeDormTenants.forEach((tenant) => {
          const alreadyExists = currentWorkspace.invoices.some((invoice) => invoice.tenantId === tenant.id && invoice.period === period);
          if (alreadyExists) {
            return;
          }

          const room = currentWorkspace.rooms.find((item) => item.id === tenant.roomId);
          if (!room) {
            return;
          }

          newInvoices.push({
            id: `inv-${Date.now()}-${tenant.id}`,
            dormId: targetDormId,
            tenantId: tenant.id,
            tenantName: tenant.name,
            roomNumber: room.roomNumber,
            amount: room.rentPerMonth,
            dueDate: '2026-05-01',
            issuedDate: '2026-03-31',
            status: 'Issued',
            period,
          });
        });

        createdCount = newInvoices.length;
        if (createdCount === 0) {
          return currentWorkspace;
        }

        const nextWorkspace = {
          ...currentWorkspace,
          invoices: [...newInvoices, ...currentWorkspace.invoices],
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetDormId,
            'invoice',
            `Invoices generated for ${period}`,
            'System',
            `${createdCount} invoice${createdCount === 1 ? '' : 's'}`,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return createdCount;
    },
    addMaintenanceTicket: ({ title, roomId, roomNumber, tenantName, description, category, priority = 'Medium' }) => {
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;
      const nextTicket: WorkspaceMaintenanceRecord = {
        id: `maint-${Date.now()}`,
        dormId: targetDormId,
        title,
        roomId,
        roomNumber,
        tenantName,
        priority,
        status: 'Open',
        submittedDate: '2026-03-31',
        updatedDate: '2026-03-31',
        description,
        category,
      };

      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          maintenanceTickets: [nextTicket, ...currentWorkspace.maintenanceTickets],
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetDormId,
            'maintenance',
            `New maintenance request — Room ${roomNumber}`,
            tenantName,
            priority,
          ),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextTicket;
    },
    updateMaintenanceStatus: (ticketId, status) => {
      setWorkspace((currentWorkspace) => {
        const targetTicket = currentWorkspace.maintenanceTickets.find((ticket) => ticket.id === ticketId);
        if (!targetTicket) {
          return currentWorkspace;
        }

        const nextWorkspace = {
          ...currentWorkspace,
          maintenanceTickets: currentWorkspace.maintenanceTickets.map((ticket) => (
            ticket.id === ticketId ? { ...ticket, status, updatedDate: '2026-03-31' } : ticket
          )),
          activityFeed: appendActivityItem(
            currentWorkspace.activityFeed,
            targetTicket.dormId,
            'maintenance',
            `Maintenance updated — Room ${targetTicket.roomNumber}`,
            'Admin',
            status,
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
    addMeal: ({ name, category, day, servings, calories }) => {
      const targetDormId = currentDorm?.id ?? workspace.currentDormId;
      const nextMeal: MealItemRecord = {
        id: `meal-${Date.now()}`,
        dormId: targetDormId,
        name,
        category,
        day,
        servings,
        dietary: [],
        status: 'Planned',
        calories,
      };

      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          mealItems: [...currentWorkspace.mealItems, nextMeal],
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });

      return nextMeal;
    },
    updateMealStatus: (mealId, status) => {
      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          mealItems: currentWorkspace.mealItems.map((meal) => (
            meal.id === mealId ? { ...meal, status } : meal
          )),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
    deleteMeal: (mealId) => {
      setWorkspace((currentWorkspace) => {
        const nextWorkspace = {
          ...currentWorkspace,
          mealItems: currentWorkspace.mealItems.filter((meal) => meal.id !== mealId),
        };
        persistWorkspace(nextWorkspace);
        return nextWorkspace;
      });
    },
  }), [
    currentDorm,
    currentDormActivityFeed,
    currentDormChefs,
    currentDormInvoices,
    currentDormMaintenanceTickets,
    currentDormMeals,
    currentDormRooms,
    currentDormTenants,
    isHydrated,
    workspace,
  ]);

  return <DemoWorkspaceContext.Provider value={value}>{children}</DemoWorkspaceContext.Provider>;
}

export function useDemoWorkspace() {
  const context = useContext(DemoWorkspaceContext);

  if (!context) {
    throw new Error('useDemoWorkspace must be used within DemoWorkspaceProvider');
  }

  return context;
}
