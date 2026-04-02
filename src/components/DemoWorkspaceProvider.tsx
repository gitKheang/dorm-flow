"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useDemoAppState } from "@/components/DemoAppProvider";
import { useDemoSession } from "@/components/DemoSessionProvider";
import type { EnabledModule } from "@/lib/modules";
import type {
  ChefMember,
  DemoDorm,
  DemoWorkspaceState,
  MealItemRecord,
  TenantMealPreference,
  WorkspaceActivityRecord,
  WorkspaceInvoiceRecord,
  WorkspaceMaintenanceRecord,
  WorkspaceNotificationRecord,
  WorkspacePaymentRecord,
  WorkspaceRoomRecord,
  WorkspaceTenantRecord,
} from "@/lib/demoWorkspace";
import {
  canToggleModule as canToggleDormModule,
  canUsePremiumFeature as canUseDormPremiumFeature,
  getDormAvailableModules,
  getDormPlan,
  getDormPremiumFeatureAccess,
  isPremiumDorm as isPremiumDormState,
  isNotificationVisibleToViewer,
} from "@/lib/demoWorkspace";
import type { DormPlan, PremiumFeature, PremiumFeatureAccess } from "@/lib/plans";
import type { Room, RoomStatus, Tenant } from "@/lib/mockData";
import {
  addDormToWorkspace,
  addMealRecord,
  addRoomRecord,
  archiveDormRecord,
  createChefWithInvitation,
  createResidentWithInvitation,
  createMaintenanceTicketRecord,
  deleteMealRecord,
  deleteRoomRecord,
  generateInvoicesForCurrentDorm,
  markAllNotificationsReadRecord,
  markNotificationReadRecord,
  recordInvoicePaymentRecord,
  rejectInvoicePaymentRecord,
  reassignTenantRoomRecord,
  reInviteChefWithInvitation,
  setDormModuleEnabledRecord,
  setDormPlanRecord,
  setTenantMealPreferenceRecord,
  setWorkspaceActiveDorm,
  syncWorkspaceState,
  mapDormToAuthDorm,
  upgradeDormToPremiumRecord,
  updateDormRecord,
  updateChefStatusRecord,
  updateMaintenanceTicketStatus,
  updateMealStatusRecord,
  updateRoomRecord,
  updateRoomStatusRecord,
  updateTenantStatusRecord,
  type AddDormInput,
  type AddMaintenanceTicketInput,
  type AddMealInput,
  type CreateChefWithInvitationInput,
  type CreateResidentWithInvitationInput,
  type UpdateDormInput,
} from "@/lib/domain/workspaceActions";

interface DemoWorkspaceContextValue {
  isHydrated: boolean;
  workspace: DemoWorkspaceState;
  currentDorm: DemoDorm | null;
  currentDormPlan: DormPlan;
  currentDormRooms: WorkspaceRoomRecord[];
  currentDormTenants: WorkspaceTenantRecord[];
  currentDormChefs: ChefMember[];
  currentDormInvoices: WorkspaceInvoiceRecord[];
  currentDormPayments: WorkspacePaymentRecord[];
  currentDormMaintenanceTickets: WorkspaceMaintenanceRecord[];
  currentDormActivityFeed: WorkspaceActivityRecord[];
  currentDormMeals: MealItemRecord[];
  currentUserNotifications: WorkspaceNotificationRecord[];
  unreadNotificationCount: number;
  hasModule: (module: EnabledModule) => boolean;
  isPremiumDorm: (dormId?: string) => boolean;
  canUsePremiumFeature: (
    feature: PremiumFeature,
    dormId?: string,
  ) => boolean;
  getPremiumFeatureAccess: (
    feature: PremiumFeature,
    dormId?: string,
  ) => PremiumFeatureAccess;
  canToggleModule: (module: EnabledModule, dormId?: string) => boolean;
  setModuleEnabled: (module: EnabledModule, enabled: boolean) => void;
  setDormPlan: (plan: DormPlan, dormId?: string) => void;
  upgradeDormToPremium: (dormId?: string) => void;
  setCurrentDorm: (dormId: string) => void;
  addDorm: (input: AddDormInput) => DemoDorm;
  updateDorm: (dormId: string, updates: UpdateDormInput) => void;
  archiveDorm: (dormId: string) => boolean;
  createResidentWithInvitation: (input: CreateResidentWithInvitationInput) => {
    resident: WorkspaceTenantRecord;
    invitationCode: string;
  };
  reassignTenantRoom: (tenantId: string, roomId: string) => void;
  updateTenantStatus: (tenantId: string, status: Tenant["status"]) => void;
  createChefWithInvitation: (input: CreateChefWithInvitationInput) => {
    chef: ChefMember;
    invitationCode: string;
  };
  canReInviteChef: (chefId: string) => boolean;
  reInviteChef: (chefId: string) => {
    chef: ChefMember;
    invitationCode: string;
  };
  updateChefStatus: (chefId: string, status: ChefMember["status"]) => void;
  addRoom: (room: Room) => WorkspaceRoomRecord;
  updateRoom: (room: Room) => WorkspaceRoomRecord;
  deleteRoom: (roomId: string) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  generateInvoices: (period?: string) => number;
  recordInvoicePayment: (invoiceId: string) => void;
  rejectInvoicePayment: (invoiceId: string) => void;
  addMaintenanceTicket: (
    input: AddMaintenanceTicketInput,
  ) => WorkspaceMaintenanceRecord;
  updateMaintenanceStatus: (
    ticketId: string,
    status: WorkspaceMaintenanceRecord["status"],
  ) => void;
  setTenantMealPreference: (
    tenantId: string,
    updates: Omit<TenantMealPreference, "tenantId">,
  ) => void;
  addMeal: (input: AddMealInput) => MealItemRecord;
  updateMealStatus: (mealId: string, status: MealItemRecord["status"]) => void;
  deleteMeal: (mealId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

const DemoWorkspaceContext = createContext<
  DemoWorkspaceContextValue | undefined
>(undefined);

export default function DemoWorkspaceProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    authService,
    authState,
    commitState,
    commitWorkspaceState,
    isHydrated,
    workspaceState,
  } = useDemoAppState();
  const { session } = useDemoSession();

  const activeDormId = session?.activeDorm.id ?? workspaceState.currentDormId;
  const accessibleDormIds = useMemo(
    () =>
      new Set(
        session?.memberships.map((membership) => membership.dormId) ?? [
          activeDormId,
        ],
      ),
    [activeDormId, session?.memberships],
  );
  const currentDorm = useMemo(
    () =>
      workspaceState.dorms.find(
        (dorm) =>
          dorm.id === activeDormId &&
          dorm.status === "Active" &&
          accessibleDormIds.has(dorm.id),
      ) ?? null,
    [accessibleDormIds, activeDormId, workspaceState.dorms],
  );
  const currentDormPlan = useMemo(
    () =>
      getDormPlan(
        workspaceState,
        currentDorm?.id ?? activeDormId,
      ),
    [activeDormId, currentDorm?.id, workspaceState],
  );
  const scopedWorkspace = useMemo<DemoWorkspaceState>(() => {
    const dorms = workspaceState.dorms.filter((dorm) =>
      accessibleDormIds.has(dorm.id),
    );
    const tenants = workspaceState.tenants.filter((tenant) =>
      accessibleDormIds.has(tenant.dormId),
    );
    const tenantIds = new Set(tenants.map((tenant) => tenant.id));

    return {
      ...workspaceState,
      currentDormId: currentDorm?.id ?? activeDormId,
      enabledModules: currentDorm
        ? getDormAvailableModules(workspaceState, currentDorm.id)
        : workspaceState.enabledModules,
      dormModules: workspaceState.dormModules.filter((item) =>
        accessibleDormIds.has(item.dormId),
      ),
      dormPlans: workspaceState.dormPlans.filter((item) =>
        accessibleDormIds.has(item.dormId),
      ),
      dorms,
      rooms: workspaceState.rooms.filter((room) =>
        accessibleDormIds.has(room.dormId),
      ),
      tenants,
      chefs: workspaceState.chefs.filter((chef) =>
        accessibleDormIds.has(chef.dormId),
      ),
      invoices: workspaceState.invoices.filter((invoice) =>
        accessibleDormIds.has(invoice.dormId),
      ),
      payments: workspaceState.payments.filter((payment) =>
        accessibleDormIds.has(payment.dormId),
      ),
      maintenanceTickets: workspaceState.maintenanceTickets.filter((ticket) =>
        accessibleDormIds.has(ticket.dormId),
      ),
      maintenanceStatusHistory: workspaceState.maintenanceStatusHistory.filter(
        (entry) => accessibleDormIds.has(entry.dormId),
      ),
      activityFeed: workspaceState.activityFeed.filter((item) =>
        accessibleDormIds.has(item.dormId),
      ),
      notifications: workspaceState.notifications.filter((notification) =>
        accessibleDormIds.has(notification.dormId),
      ),
      tenantMealPreferences: workspaceState.tenantMealPreferences.filter(
        (preference) => tenantIds.has(preference.tenantId),
      ),
      mealItems: workspaceState.mealItems.filter((meal) =>
        accessibleDormIds.has(meal.dormId),
      ),
    };
  }, [accessibleDormIds, activeDormId, currentDorm, workspaceState]);

  const currentDormRooms = useMemo(
    () =>
      workspaceState.rooms.filter((room) => room.dormId === currentDorm?.id),
    [currentDorm?.id, workspaceState.rooms],
  );
  const currentDormTenants = useMemo(
    () =>
      workspaceState.tenants.filter(
        (tenant) => tenant.dormId === currentDorm?.id,
      ),
    [currentDorm?.id, workspaceState.tenants],
  );
  const currentDormChefs = useMemo(
    () =>
      workspaceState.chefs.filter((chef) => chef.dormId === currentDorm?.id),
    [currentDorm?.id, workspaceState.chefs],
  );
  const currentDormInvoices = useMemo(
    () =>
      workspaceState.invoices.filter(
        (invoice) => invoice.dormId === currentDorm?.id,
      ),
    [currentDorm?.id, workspaceState.invoices],
  );
  const currentDormPayments = useMemo(
    () =>
      workspaceState.payments.filter(
        (payment) => payment.dormId === currentDorm?.id,
      ),
    [currentDorm?.id, workspaceState.payments],
  );
  const currentDormMaintenanceTickets = useMemo(
    () =>
      workspaceState.maintenanceTickets.filter(
        (ticket) => ticket.dormId === currentDorm?.id,
      ),
    [currentDorm?.id, workspaceState.maintenanceTickets],
  );
  const currentDormActivityFeed = useMemo(
    () =>
      workspaceState.activityFeed.filter(
        (item) => item.dormId === currentDorm?.id,
      ),
    [currentDorm?.id, workspaceState.activityFeed],
  );
  const currentDormMeals = useMemo(
    () =>
      workspaceState.mealItems.filter(
        (meal) => meal.dormId === currentDorm?.id,
      ),
    [currentDorm?.id, workspaceState.mealItems],
  );
  const currentUserNotifications = useMemo(() => {
    if (!session || !currentDorm) {
      return [];
    }

    const viewer = {
      role: session.role,
      userId: session.user.id,
      activeDormId: currentDorm.id,
      tenantId: session.tenantId,
    } as const;

    return workspaceState.notifications
      .filter((notification) =>
        isNotificationVisibleToViewer(notification, viewer),
      )
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime(),
      );
  }, [currentDorm, session, workspaceState.notifications]);
  const unreadNotificationCount = useMemo(
    () =>
      session
        ? currentUserNotifications.filter(
            (notification) =>
              !notification.readByUserIds.includes(session.user.id),
          ).length
        : 0,
    [currentUserNotifications, session],
  );

  const value = useMemo<DemoWorkspaceContextValue>(
    () => ({
      isHydrated,
      workspace: scopedWorkspace,
      currentDorm,
      currentDormPlan,
      currentDormRooms,
      currentDormTenants,
      currentDormChefs,
      currentDormInvoices,
      currentDormPayments,
      currentDormMaintenanceTickets,
      currentDormActivityFeed,
      currentDormMeals,
      currentUserNotifications,
      unreadNotificationCount,
      hasModule: (module) => {
        if (module === "core") {
          return true;
        }

        return currentDorm
          ? getDormAvailableModules(workspaceState, currentDorm.id).includes(
              module,
            )
          : false;
      },
      isPremiumDorm: (dormId) =>
        isPremiumDormState(
          workspaceState,
          dormId ?? currentDorm?.id ?? workspaceState.currentDormId,
        ),
      canUsePremiumFeature: (feature, dormId) => {
        const resolvedDormId = dormId ?? currentDorm?.id;
        return resolvedDormId
          ? canUseDormPremiumFeature(workspaceState, resolvedDormId, feature)
          : false;
      },
      getPremiumFeatureAccess: (feature, dormId) => {
        const resolvedDormId =
          dormId ?? currentDorm?.id ?? workspaceState.currentDormId;
        return getDormPremiumFeatureAccess(
          workspaceState,
          resolvedDormId,
          feature,
        );
      },
      canToggleModule: (module, dormId) => {
        const resolvedDormId = dormId ?? currentDorm?.id;
        return resolvedDormId
          ? canToggleDormModule(workspaceState, resolvedDormId, module)
          : false;
      },
      setModuleEnabled: (module, enabled) => {
        if (!currentDorm) return;
        commitWorkspaceState(
          setDormModuleEnabledRecord(
            workspaceState,
            session,
            currentDorm.id,
            module,
            enabled,
          ),
        );
      },
      setDormPlan: (plan, dormId) => {
        const resolvedDormId = dormId ?? currentDorm?.id;
        if (!resolvedDormId) return;

        commitWorkspaceState(
          setDormPlanRecord(workspaceState, session, resolvedDormId, plan),
        );
      },
      upgradeDormToPremium: (dormId) => {
        const resolvedDormId = dormId ?? currentDorm?.id;
        if (!resolvedDormId) return;

        commitWorkspaceState(
          upgradeDormToPremiumRecord(
            workspaceState,
            session,
            resolvedDormId,
          ),
        );
      },
      setCurrentDorm: (dormId) => {
        commitWorkspaceState(
          setWorkspaceActiveDorm(workspaceState, session, dormId),
        );
      },
      addDorm: (input) => {
        const result = addDormToWorkspace(workspaceState, session, input);
        if (!authState?.session || !session || session.role !== "Admin") {
          commitWorkspaceState(result.workspace);
          return result.value;
        }

        // Keep auth membership/session and workspace creation in one commit so
        // a newly added dorm is immediately visible and actionable.
        const syncedAuthSnapshot = authService.syncDorms(
          authState,
          result.workspace.dorms.map(mapDormToAuthDorm),
        );
        const membershipSnapshot = authService.ensureOwnerMembership(
          syncedAuthSnapshot,
          {
            userId: authState.session.userId,
            dorm: mapDormToAuthDorm(result.value),
          },
        ).snapshot;
        const switchedSnapshot = authService.switchActiveDorm(
          membershipSnapshot,
          {
            userId: authState.session.userId,
            dormId: result.value.id,
          },
        ).snapshot;

        commitState({
          authState: switchedSnapshot,
          workspaceState: result.workspace,
        });
        return result.value;
      },
      updateDorm: (dormId, updates) => {
        commitWorkspaceState(
          updateDormRecord(workspaceState, session, dormId, updates),
        );
      },
      archiveDorm: (dormId) => {
        try {
          const nextWorkspaceState = archiveDormRecord(
            workspaceState,
            session,
            dormId,
          );
          const shouldSwitchArchivedDorm =
            Boolean(authState?.session) &&
            session?.activeDorm.id === dormId;
          const syncedAuthSnapshot = authState
            ? authService.syncDorms(
                authState,
                nextWorkspaceState.dorms.map(mapDormToAuthDorm),
              )
            : null;

          if (
            !shouldSwitchArchivedDorm ||
            !syncedAuthSnapshot?.session ||
            !session
          ) {
            commitWorkspaceState(nextWorkspaceState);
            return true;
          }

          const fallbackMembership = syncedAuthSnapshot.memberships.find(
            (membership) =>
              membership.userId === syncedAuthSnapshot.session?.userId &&
              membership.status === "active" &&
              nextWorkspaceState.dorms.some(
                (dorm) =>
                  dorm.id === membership.dormId && dorm.status === "Active",
              ),
          );

          if (!fallbackMembership) {
            commitState({
              authState: authService.signOut(syncedAuthSnapshot).snapshot,
              workspaceState: nextWorkspaceState,
            });
            return true;
          }

          const switchedSnapshot = authService.switchActiveDorm(
            syncedAuthSnapshot,
            {
              userId: syncedAuthSnapshot.session.userId,
              dormId: fallbackMembership.dormId,
            },
          ).snapshot;

          commitState({
            authState: switchedSnapshot,
            workspaceState: nextWorkspaceState,
          });
          return true;
        } catch {
          return false;
        }
      },
      createResidentWithInvitation: (input) => {
        if (!authState) {
          throw new Error("Auth is still loading.");
        }

        const result = createResidentWithInvitation({
          auth: authState,
          authService,
          session,
          workspace: workspaceState,
          input,
        });
        commitState({
          authState: result.auth,
          workspaceState: result.workspace,
        });
        if (!result.invitation) {
          throw new Error("Invitation could not be created.");
        }

        return {
          resident: result.value,
          invitationCode: result.invitation.code,
        };
      },
      reassignTenantRoom: (tenantId, roomId) => {
        commitWorkspaceState(
          reassignTenantRoomRecord(workspaceState, session, tenantId, roomId),
        );
      },
      updateTenantStatus: (tenantId, status) => {
        commitWorkspaceState(
          updateTenantStatusRecord(workspaceState, session, tenantId, status),
        );
      },
      createChefWithInvitation: (input) => {
        if (!authState) {
          throw new Error("Auth is still loading.");
        }

        const result = createChefWithInvitation({
          auth: authState,
          authService,
          session,
          workspace: workspaceState,
          input,
        });
        commitState({
          authState: result.auth,
          workspaceState: result.workspace,
        });
        if (!result.invitation) {
          throw new Error("Invitation could not be created.");
        }

        return {
          chef: result.value,
          invitationCode: result.invitation.code,
        };
      },
      canReInviteChef: (chefId) => {
        if (
          !authState ||
          !currentDorm ||
          !canUseDormPremiumFeature(workspaceState, currentDorm.id, "chefManagement")
        ) {
          return false;
        }

        const chef = workspaceState.chefs.find(
          (candidate) => candidate.id === chefId && candidate.dormId === currentDorm.id,
        );
        if (!chef || chef.invitationLifecycleState === "pending") {
          return false;
        }

        const hasExistingAccount =
          authState.chefProfiles.some(
            (profile) => profile.chefId === chef.id && profile.dormId === currentDorm.id,
          ) ||
          authState.memberships.some((membership) => {
            if (membership.dormId !== currentDorm.id || membership.role !== "Chef") {
              return false;
            }

            const user = authState.users.find(
              (candidate) => candidate.id === membership.userId,
            );
            return Boolean(
              user && user.email.trim().toLowerCase() === chef.email.trim().toLowerCase(),
            );
          });

        return !hasExistingAccount;
      },
      reInviteChef: (chefId) => {
        if (!authState) {
          throw new Error("Auth is still loading.");
        }

        const result = reInviteChefWithInvitation({
          auth: authState,
          authService,
          session,
          workspace: workspaceState,
          chefId,
        });
        commitState({
          authState: result.auth,
          workspaceState: result.workspace,
        });
        if (!result.invitation) {
          throw new Error("Invitation could not be created.");
        }

        return {
          chef: result.value,
          invitationCode: result.invitation.code,
        };
      },
      updateChefStatus: (chefId, status) => {
        commitWorkspaceState(
          updateChefStatusRecord(workspaceState, session, chefId, status),
        );
      },
      addRoom: (room) => {
        const result = addRoomRecord(workspaceState, session, room);
        commitWorkspaceState(result.workspace);
        return result.value;
      },
      updateRoom: (room) => {
        const result = updateRoomRecord(workspaceState, session, room);
        commitWorkspaceState(result.workspace);
        return result.value;
      },
      deleteRoom: (roomId) => {
        commitWorkspaceState(deleteRoomRecord(workspaceState, session, roomId));
      },
      updateRoomStatus: (roomId, status) => {
        commitWorkspaceState(
          updateRoomStatusRecord(workspaceState, session, roomId, status),
        );
      },
      generateInvoices: (period = "May 2026") => {
        const result = generateInvoicesForCurrentDorm(
          workspaceState,
          session,
          period,
        );
        commitWorkspaceState(result.workspace);
        return result.value;
      },
      recordInvoicePayment: (invoiceId) => {
        commitWorkspaceState(
          recordInvoicePaymentRecord(workspaceState, session, invoiceId),
        );
      },
      rejectInvoicePayment: (invoiceId) => {
        commitWorkspaceState(
          rejectInvoicePaymentRecord(workspaceState, session, invoiceId),
        );
      },
      addMaintenanceTicket: (input) => {
        const result = createMaintenanceTicketRecord(
          workspaceState,
          session,
          input,
        );
        commitWorkspaceState(result.workspace);
        return result.value;
      },
      updateMaintenanceStatus: (ticketId, status) => {
        commitWorkspaceState(
          updateMaintenanceTicketStatus(
            workspaceState,
            session,
            ticketId,
            status,
          ),
        );
      },
      setTenantMealPreference: (tenantId, updates) => {
        commitWorkspaceState(
          setTenantMealPreferenceRecord(
            workspaceState,
            session,
            tenantId,
            updates,
          ),
        );
      },
      addMeal: (input) => {
        const result = addMealRecord(workspaceState, session, input);
        commitWorkspaceState(result.workspace);
        return result.value;
      },
      updateMealStatus: (mealId, status) => {
        commitWorkspaceState(
          updateMealStatusRecord(workspaceState, session, mealId, status),
        );
      },
      deleteMeal: (mealId) => {
        commitWorkspaceState(deleteMealRecord(workspaceState, session, mealId));
      },
      markNotificationRead: (notificationId) => {
        commitWorkspaceState(
          markNotificationReadRecord(workspaceState, session, notificationId),
        );
      },
      markAllNotificationsRead: () => {
        commitWorkspaceState(
          markAllNotificationsReadRecord(workspaceState, session),
        );
      },
    }),
    [
      authService,
      authState,
      commitState,
      commitWorkspaceState,
      currentDorm,
      currentDormPlan,
      currentDormActivityFeed,
      currentDormChefs,
      currentDormInvoices,
      currentDormPayments,
      currentDormMaintenanceTickets,
      currentDormMeals,
      currentDormRooms,
      currentDormTenants,
      currentUserNotifications,
      isHydrated,
      scopedWorkspace,
      session,
      unreadNotificationCount,
      workspaceState,
    ],
  );

  return (
    <DemoWorkspaceContext.Provider value={value}>
      {children}
    </DemoWorkspaceContext.Provider>
  );
}

export function useDemoWorkspace() {
  const context = useContext(DemoWorkspaceContext);

  if (!context) {
    throw new Error(
      "useDemoWorkspace must be used within DemoWorkspaceProvider",
    );
  }

  return context;
}
