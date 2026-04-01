import type { AuthService } from "@/lib/auth/service";
import type { AuthStoreSnapshot, Invitation } from "@/lib/auth/types";
import {
  type DemoDorm,
  type DemoWorkspaceState,
  type DormModuleSettings,
  type MaintenanceStatusHistoryEntry,
  type PaymentStatus,
  type WorkspaceActivityRecord,
  type WorkspaceInvoiceRecord,
  type WorkspaceMaintenanceRecord,
  type WorkspaceNotificationRecord,
  type WorkspacePaymentRecord,
  type WorkspaceRoomRecord,
  type WorkspaceTenantRecord,
  DEFAULT_ENABLED_MODULES,
  getDormEnabledModules,
  isNotificationVisibleToViewer,
} from "@/lib/demoWorkspace";
import type { DemoSession } from "@/lib/demoSession";
import type { EnabledModule } from "@/lib/modules";
import type {
  ChefMember,
  ChefShift,
  MealItemRecord,
  TenantMealPreference,
} from "@/lib/demoWorkspace";
import type {
  MaintenancePriority,
  MaintenanceStatus,
  Room,
  RoomStatus,
  Tenant,
} from "@/lib/mockData";
import {
  requireActiveDormAccess,
  requireDorm,
  requireDormAccess,
  requireMembership,
  requireModuleEnabled,
} from "@/lib/domain/authorization";
import { DomainError } from "@/lib/domain/errors";
import {
  getLatestInvoicePayment,
  sortPaymentsDescending,
} from "@/lib/domain/paymentAnalytics";

export interface AddDormInput {
  name: string;
  city: string;
  address: string;
  timezone: string;
  waitlist?: number;
}

export interface UpdateDormInput {
  name?: string;
  city?: string;
  address?: string;
  timezone?: string;
  waitlist?: number;
  status?: DemoDorm["status"];
}

export interface CreateResidentWithInvitationInput {
  name: string;
  email: string;
  phone: string;
  roomId?: string;
}

export interface CreateChefWithInvitationInput {
  name: string;
  email: string;
  specialty: string;
  shift: ChefShift;
}

export interface AddMaintenanceTicketInput {
  title: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  tenantId?: string;
  description: string;
  category: string;
  priority?: MaintenancePriority;
}

export interface AddMealInput {
  name: string;
  category: MealItemRecord["category"];
  day: string;
  servings: number;
  calories: number;
}

export interface WorkspaceMutationResult<T> {
  workspace: DemoWorkspaceState;
  value: T;
}

export interface AppMutationResult<T> extends WorkspaceMutationResult<T> {
  auth: AuthStoreSnapshot;
  invitation?: Invitation;
}

function cloneWorkspaceState(
  workspace: DemoWorkspaceState,
): DemoWorkspaceState {
  return JSON.parse(JSON.stringify(workspace)) as DemoWorkspaceState;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createAvatar(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "DF"
  );
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function createRecordId(prefix: string, suffix?: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}${suffix ? `-${suffix}` : ""}-${random}`;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function getModuleLabel(module: EnabledModule) {
  switch (module) {
    case "mealService":
      return "Meal service";
    case "notifications":
      return "Notifications";
    case "analytics":
      return "Reports & analytics";
    case "multiDorm":
      return "Multi-dorm access";
    default:
      return "Core";
  }
}

function buildPaymentReference(invoiceId: string) {
  const compactId = invoiceId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `PMT-${compactId}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function resolvePaymentSource(role: DemoSession["role"]) {
  return role === "Tenant" ? "tenant-portal" : "admin-confirmation";
}

function resolvePaymentMethodLabel(role: DemoSession["role"]) {
  return role === "Tenant" ? "Card payment" : "Manual confirmation";
}

function createInvoicePaymentRecord(input: {
  invoice: WorkspaceInvoiceRecord;
  actor: DemoSession;
  status: PaymentStatus;
  source?: WorkspacePaymentRecord["source"];
  initiatedAt?: string;
  completedAt?: string;
  methodLabel?: string;
  note?: string;
  failureReason?: string;
}): WorkspacePaymentRecord {
  const {
    actor,
    completedAt,
    failureReason,
    initiatedAt,
    invoice,
    methodLabel,
    note,
    source,
    status,
  } = input;
  const timestamp = new Date().toISOString();

  return {
    id: createRecordId("payment", invoice.id),
    dormId: invoice.dormId,
    invoiceId: invoice.id,
    tenantId: invoice.tenantId,
    tenantName: invoice.tenantName,
    roomNumber: invoice.roomNumber,
    invoicePeriod: invoice.period,
    amount: invoice.amount,
    status,
    initiatedAt: initiatedAt ?? timestamp,
    completedAt:
      completedAt ?? (status === "paid" || status === "refunded" ? timestamp : undefined),
    source: source ?? resolvePaymentSource(actor.role),
    methodLabel: methodLabel ?? resolvePaymentMethodLabel(actor.role),
    reference: buildPaymentReference(invoice.id),
    recordedByUserId: actor.user.id,
    recordedByName: actor.name,
    note,
    failureReason,
  };
}

function getNextActiveDormId(dorms: DemoDorm[], currentDormId: string) {
  return (
    dorms.find((dorm) => dorm.status === "Active" && dorm.id !== currentDormId)
      ?.id ??
    dorms.find((dorm) => dorm.status === "Active")?.id ??
    currentDormId
  );
}

function appendActivityItem(
  items: WorkspaceActivityRecord[],
  dormId: string,
  type: WorkspaceActivityRecord["type"],
  message: string,
  actor: string,
  meta?: string,
) {
  return [
    {
      id: createRecordId("act"),
      dormId,
      type,
      message,
      actor,
      timestamp: new Date().toISOString(),
      meta,
    },
    ...items,
  ].slice(0, 30);
}

function createNotification(
  input: Omit<
    WorkspaceNotificationRecord,
    "id" | "timestamp" | "readByUserIds"
  >,
): WorkspaceNotificationRecord {
  return {
    id: createRecordId("notif"),
    timestamp: new Date().toISOString(),
    readByUserIds: [],
    ...input,
  };
}

function prependNotifications(
  items: WorkspaceNotificationRecord[],
  notifications: WorkspaceNotificationRecord[],
) {
  return [...notifications, ...items].slice(0, 120);
}

function prependDormNotifications(
  workspace: DemoWorkspaceState,
  dormId: string,
  notifications: WorkspaceNotificationRecord[],
) {
  if (
    notifications.length === 0 ||
    !getDormEnabledModules(workspace, dormId).includes("notifications")
  ) {
    return workspace.notifications;
  }

  return prependNotifications(workspace.notifications, notifications);
}

function resolveAuthUserName(
  auth: AuthStoreSnapshot,
  userId: string | undefined,
  fallback: string,
) {
  if (!userId) {
    return fallback;
  }

  return (
    auth.users.find((candidate) => candidate.id === userId)?.fullName ??
    fallback
  );
}

function resolveNotificationViewer(session: DemoSession) {
  return {
    role: session.role,
    userId: session.user.id,
    activeDormId: session.activeDorm.id,
    tenantId: session.tenantId,
  } as const;
}

function getDormModuleConfig(
  workspace: DemoWorkspaceState,
  dormId: string,
): DormModuleSettings {
  return {
    dormId,
    enabledModules: getDormEnabledModules(workspace, dormId),
  };
}

function parseWorkspaceDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T")
    ? value
    : `${value}T00:00:00.000Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTodayStartUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function isTenantRoomCapacityCommitted(tenant: WorkspaceTenantRecord) {
  return (
    tenant.roomId !== "unassigned" &&
    (tenant.status === "Active" ||
      tenant.invitationLifecycleState === "pending")
  );
}

function getLatestSettlementPayment(
  payments: WorkspacePaymentRecord[],
  invoiceId: string,
) {
  return sortPaymentsDescending(
    payments.filter(
      (payment) =>
        payment.invoiceId === invoiceId &&
        (payment.status === "paid" || payment.status === "refunded"),
    ),
  )[0];
}

function deriveInvoiceStatus(
  invoice: WorkspaceInvoiceRecord,
  payments: WorkspacePaymentRecord[],
) {
  const latestSettlement = getLatestSettlementPayment(payments, invoice.id);
  if (latestSettlement?.status === "paid") {
    return "Paid" as const;
  }

  if (invoice.status === "Draft") {
    return "Draft" as const;
  }

  const dueDate = parseWorkspaceDate(invoice.dueDate);
  if (dueDate && dueDate.getTime() < getTodayStartUtc().getTime()) {
    return "Overdue" as const;
  }

  return "Issued" as const;
}

function syncInvoicesWithPayments(
  invoices: WorkspaceInvoiceRecord[],
  payments: WorkspacePaymentRecord[],
) {
  return invoices.map((invoice) => ({
    ...invoice,
    status: deriveInvoiceStatus(invoice, payments),
  }));
}

function syncDormModules(workspace: DemoWorkspaceState): DemoWorkspaceState {
  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.dormModules = nextWorkspace.dorms.map((dorm) => {
    const existing = nextWorkspace.dormModules.find(
      (item) => item.dormId === dorm.id,
    );
    return {
      dormId: dorm.id,
      enabledModules: existing?.enabledModules?.length
        ? (Array.from(
            new Set(["core", ...existing.enabledModules.filter(Boolean)]),
          ) as EnabledModule[])
        : [...DEFAULT_ENABLED_MODULES],
    };
  });
  nextWorkspace.enabledModules = getDormEnabledModules(
    nextWorkspace,
    nextWorkspace.currentDormId,
  );
  return nextWorkspace;
}

function syncTenantLifecycle(
  tenants: WorkspaceTenantRecord[],
): WorkspaceTenantRecord[] {
  return tenants.map((tenant) =>
    tenant.status === "Inactive" &&
    tenant.invitationLifecycleState !== "pending" &&
    tenant.roomId !== "unassigned"
      ? { ...tenant, roomId: "unassigned" }
      : tenant,
  );
}

function syncRoomsWithTenants(
  rooms: WorkspaceRoomRecord[],
  tenants: WorkspaceTenantRecord[],
) {
  return rooms.map((room) => {
    const assignedActiveTenants = tenants
      .filter(
        (tenant) =>
          tenant.dormId === room.dormId &&
          tenant.roomId === room.id &&
          tenant.status === "Active",
      )
      .map((tenant) => tenant.name);
    const assignedPendingTenants = tenants
      .filter(
        (tenant) =>
          tenant.dormId === room.dormId &&
          tenant.roomId === room.id &&
          tenant.invitationLifecycleState === "pending",
      )
      .map((tenant) => `${tenant.name} (pending invite)`);
    const committedOccupants =
      assignedActiveTenants.length + assignedPendingTenants.length;

    let nextStatus: RoomStatus;
    if (room.status === "Under Maintenance") {
      nextStatus = "Under Maintenance";
    } else if (assignedActiveTenants.length > 0) {
      nextStatus = "Occupied";
    } else if (assignedPendingTenants.length > 0) {
      nextStatus = "Reserved";
    } else if (room.status === "Reserved") {
      nextStatus = room.status;
    } else {
      nextStatus = "Available";
    }

    return {
      ...room,
      occupants: committedOccupants,
      assignedTenants: [...assignedActiveTenants, ...assignedPendingTenants],
      status: nextStatus,
    };
  });
}

export function syncWorkspaceState(
  workspace: DemoWorkspaceState,
): DemoWorkspaceState {
  const nextWorkspace = syncDormModules(workspace);
  nextWorkspace.currentDormId = nextWorkspace.dorms.some(
    (dorm) =>
      dorm.id === nextWorkspace.currentDormId && dorm.status === "Active",
  )
    ? nextWorkspace.currentDormId
    : getNextActiveDormId(nextWorkspace.dorms, nextWorkspace.currentDormId);
  nextWorkspace.tenants = syncTenantLifecycle(nextWorkspace.tenants);
  nextWorkspace.rooms = syncRoomsWithTenants(
    nextWorkspace.rooms,
    nextWorkspace.tenants,
  );
  nextWorkspace.payments = sortPaymentsDescending(nextWorkspace.payments);
  nextWorkspace.invoices = syncInvoicesWithPayments(
    nextWorkspace.invoices,
    nextWorkspace.payments,
  );
  nextWorkspace.enabledModules = getDormEnabledModules(
    nextWorkspace,
    nextWorkspace.currentDormId,
  );
  return nextWorkspace;
}

export function mapDormToAuthDorm(dorm: DemoDorm) {
  return {
    id: dorm.id,
    name: dorm.name,
    city: dorm.city,
    address: dorm.address,
    timezone: dorm.timezone,
    status: dorm.status,
  } as const;
}

function requireUniqueTenantEmail(
  workspace: DemoWorkspaceState,
  dormId: string,
  email: string,
  ignoreTenantId?: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const conflict = workspace.tenants.find(
    (tenant) =>
      tenant.dormId === dormId &&
      tenant.id !== ignoreTenantId &&
      normalizeEmail(tenant.email) === normalizedEmail,
  );

  if (conflict) {
    throw new DomainError(
      "TENANT_EMAIL_CONFLICT",
      "A resident with that email already exists in this dorm.",
    );
  }
}

function requireUniqueChefEmail(
  workspace: DemoWorkspaceState,
  dormId: string,
  email: string,
  ignoreChefId?: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const conflict = workspace.chefs.find(
    (chef) =>
      chef.dormId === dormId &&
      chef.id !== ignoreChefId &&
      normalizeEmail(chef.email) === normalizedEmail,
  );

  if (conflict) {
    throw new DomainError(
      "CHEF_EMAIL_CONFLICT",
      "A chef with that email already exists in this dorm.",
    );
  }
}

function requireRoom(
  workspace: DemoWorkspaceState,
  dormId: string,
  roomId: string,
): WorkspaceRoomRecord {
  const room = workspace.rooms.find(
    (candidate) => candidate.id === roomId && candidate.dormId === dormId,
  );
  if (!room) {
    throw new DomainError(
      "ROOM_NOT_FOUND",
      "Room not found in the active dorm.",
    );
  }

  return room;
}

function countActiveOccupants(
  workspace: DemoWorkspaceState,
  roomId: string,
  ignoreTenantId?: string,
) {
  return workspace.tenants.filter(
    (tenant) =>
      tenant.roomId === roomId &&
      tenant.status === "Active" &&
      tenant.id !== ignoreTenantId,
  ).length;
}

function countCommittedOccupants(
  workspace: DemoWorkspaceState,
  roomId: string,
  ignoreTenantId?: string,
) {
  return workspace.tenants.filter(
    (tenant) =>
      tenant.roomId === roomId &&
      tenant.id !== ignoreTenantId &&
      isTenantRoomCapacityCommitted(tenant),
  ).length;
}

function assertRoomAssignable(
  workspace: DemoWorkspaceState,
  dormId: string,
  roomId: string | undefined,
  ignoreTenantId?: string,
  options?: {
    allowReservedCurrentAssignment?: boolean;
  },
) {
  if (!roomId || roomId === "unassigned") {
    return;
  }

  const room = requireRoom(workspace, dormId, roomId);
  const committedOccupants = countCommittedOccupants(
    workspace,
    roomId,
    ignoreTenantId,
  );
  const isCurrentAssignment =
    Boolean(ignoreTenantId) &&
    workspace.tenants.some(
      (tenant) => tenant.id === ignoreTenantId && tenant.roomId === roomId,
    );
  const canReuseReservedAssignment =
    room.status === "Reserved" &&
    options?.allowReservedCurrentAssignment &&
    isCurrentAssignment;
  const canFillReservedCapacity =
    room.status === "Reserved" && committedOccupants > 0;

  if (
    room.status === "Under Maintenance" ||
    (room.status === "Reserved" &&
      !canReuseReservedAssignment &&
      !canFillReservedCapacity)
  ) {
    throw new DomainError(
      "ROOM_NOT_ASSIGNABLE",
      "Only available rooms can receive new resident assignments.",
    );
  }
  if (committedOccupants >= room.capacity) {
    throw new DomainError(
      "ROOM_CAPACITY_EXCEEDED",
      "Room capacity cannot be exceeded.",
    );
  }
}

function normalizeRoomRecord(room: Room, dormId: string): WorkspaceRoomRecord {
  return {
    ...room,
    dormId,
    occupants: 0,
    assignedTenants: [],
  };
}

function buildBillingPeriodKey(period: string) {
  return period.trim().toLowerCase().replace(/\s+/g, "-");
}

function buildBillingDates(period: string) {
  const issuedAt = new Date();
  const parsed = new Date(`1 ${period}`);
  return {
    issuedDate: formatDate(issuedAt),
    dueDate: Number.isNaN(parsed.getTime())
      ? formatDate(issuedAt)
      : formatDate(parsed),
    billingPeriodKey: buildBillingPeriodKey(period),
  };
}

const MAINTENANCE_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> =
  {
    Open: ["In Progress", "Resolved"],
    "In Progress": ["Open", "Resolved"],
    Resolved: ["Open", "In Progress"],
  };

function createMaintenanceHistoryEntry(
  ticketId: string,
  dormId: string,
  fromStatus: MaintenanceStatus | undefined,
  toStatus: MaintenanceStatus,
  actor: DemoSession,
  note?: string,
): MaintenanceStatusHistoryEntry {
  return {
    id: createRecordId("maint-history", ticketId),
    dormId,
    ticketId,
    fromStatus,
    toStatus,
    changedAt: new Date().toISOString(),
    changedByUserId: actor.user.id,
    changedByName: actor.name,
    changedByRole: actor.role,
    note,
  };
}

function findTenantByName(
  workspace: DemoWorkspaceState,
  dormId: string,
  tenantName: string,
) {
  const normalizedName = tenantName.trim().toLowerCase();
  return workspace.tenants.find(
    (tenant) =>
      tenant.dormId === dormId &&
      tenant.name.trim().toLowerCase() === normalizedName,
  );
}

function findTicketTenant(
  workspace: DemoWorkspaceState,
  ticket: WorkspaceMaintenanceRecord,
) {
  if (ticket.createdByTenantId) {
    return workspace.tenants.find(
      (tenant) =>
        tenant.id === ticket.createdByTenantId &&
        tenant.dormId === ticket.dormId,
    );
  }

  return findTenantByName(workspace, ticket.dormId, ticket.tenantName);
}

export function createDormRecord(
  workspace: DemoWorkspaceState,
  input: AddDormInput,
): WorkspaceMutationResult<DemoDorm> {
  const nextWorkspace = cloneWorkspaceState(workspace);
  const sourceModules = getDormEnabledModules(
    workspace,
    workspace.currentDormId,
  );
  const nextDorm: DemoDorm = {
    id: `dorm-${Date.now()}`,
    name: input.name.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    timezone: input.timezone.trim(),
    waitlist: input.waitlist ?? 0,
    status: "Active",
    openedOn: formatDate(new Date()),
  };

  nextWorkspace.dorms.unshift(nextDorm);
  nextWorkspace.dormModules.unshift({
    dormId: nextDorm.id,
    enabledModules: [...sourceModules],
  });
  nextWorkspace.currentDormId = nextDorm.id;
  return { workspace: syncWorkspaceState(nextWorkspace), value: nextDorm };
}

export function addDormToWorkspace(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  input: AddDormInput,
): WorkspaceMutationResult<DemoDorm> {
  requireActiveDormAccess(workspace, session, ["Admin"]);
  requireModuleEnabled(workspace, session!.activeDorm.id, "multiDorm");
  return createDormRecord(workspace, input);
}

export function setWorkspaceActiveDorm(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  dormId: string,
): DemoWorkspaceState {
  requireDormAccess(workspace, session, dormId);
  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.currentDormId = dormId;
  return syncWorkspaceState(nextWorkspace);
}

export function updateDormRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  dormId: string,
  updates: UpdateDormInput,
): DemoWorkspaceState {
  requireDormAccess(workspace, session, dormId, ["Admin"]);
  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.dorms = nextWorkspace.dorms.map((dorm) =>
    dorm.id === dormId ? { ...dorm, ...updates } : dorm,
  );
  return syncWorkspaceState(nextWorkspace);
}

export function archiveDormRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  dormId: string,
): DemoWorkspaceState {
  requireActiveDormAccess(workspace, session, ["Admin"]);
  requireModuleEnabled(workspace, session!.activeDorm.id, "multiDorm");
  requireDormAccess(workspace, session, dormId, ["Admin"]);

  const activeDorms = workspace.dorms.filter(
    (dorm) => dorm.status === "Active",
  );
  if (activeDorms.length <= 1) {
    throw new DomainError(
      "DORM_ARCHIVE_BLOCKED",
      "At least one active dorm must remain available.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.dorms = nextWorkspace.dorms.map((dorm) =>
    dorm.id === dormId ? { ...dorm, status: "Archived" as const } : dorm,
  );
  if (nextWorkspace.currentDormId === dormId) {
    nextWorkspace.currentDormId = getNextActiveDormId(
      nextWorkspace.dorms,
      dormId,
    );
  }
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dormId,
    "assignment",
    `Dorm archived: ${workspace.dorms.find((dorm) => dorm.id === dormId)?.name ?? dormId}`,
    session!.name,
    "Operational actions are now read-only for this dorm",
  );
  return syncWorkspaceState(nextWorkspace);
}

export function setDormModuleEnabledRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  dormId: string,
  module: EnabledModule,
  enabled: boolean,
): DemoWorkspaceState {
  requireDormAccess(workspace, session, dormId, ["Admin"]);
  if (module === "core") {
    return workspace;
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.dormModules = nextWorkspace.dormModules.map((entry) => {
    if (entry.dormId !== dormId) {
      return entry;
    }

    const nextModules = enabled
      ? Array.from(new Set([...entry.enabledModules, module]))
      : entry.enabledModules.filter((candidate) => candidate !== module);

    return {
      ...entry,
      enabledModules: [
        "core",
        ...nextModules.filter((candidate) => candidate !== "core"),
      ],
    };
  });
  const toggleLabel = `${getModuleLabel(module)} ${enabled ? "enabled" : "disabled"}`;
  const affectedTenantIds = workspace.tenants
    .filter((tenant) => tenant.dormId === dormId)
    .map((tenant) => tenant.id);
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dormId,
    "assignment",
    toggleLabel,
    session!.name,
    module,
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dormId, [
    createNotification({
      dormId,
      type: module === "mealService" ? "meal" : "assignment",
      eventType: "module-toggle-changed",
      message: toggleLabel,
      actor: session!.name,
      meta:
        module === "mealService"
          ? enabled
            ? "Chef operations and meal preferences are available again"
            : "Chef operations are paused and meal history remains visible"
          : module === "notifications"
            ? enabled
              ? "New dorm alerts will appear again"
              : "Existing history is preserved while new alerts are paused"
            : module === "analytics"
              ? "Historical reports stay intact"
              : "Dorm data remains unchanged",
      tenantIds:
        module === "mealService" || module === "notifications"
          ? affectedTenantIds
          : [],
      chefVisible: module === "mealService" || module === "notifications",
    }),
  ]);
  return syncWorkspaceState(nextWorkspace);
}

export function createResidentWithInvitation(params: {
  auth: AuthStoreSnapshot;
  authService: AuthService;
  session: DemoSession | null;
  workspace: DemoWorkspaceState;
  input: CreateResidentWithInvitationInput;
}): AppMutationResult<WorkspaceTenantRecord> {
  const { auth, authService, session, workspace, input } = params;
  const { dorm, membership } = requireActiveDormAccess(workspace, session, [
    "Admin",
  ]);
  void membership;

  requireUniqueTenantEmail(workspace, dorm.id, input.email);
  assertRoomAssignable(workspace, dorm.id, input.roomId);

  const nextTenant: WorkspaceTenantRecord = {
    id: createRecordId("tenant"),
    dormId: dorm.id,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    phone: input.phone.trim(),
    avatar: createAvatar(input.name),
    roomId: input.roomId ?? "unassigned",
    moveInDate: formatDate(new Date()),
    status: "Inactive",
    invitationLifecycleState: "pending",
  };

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.tenants.unshift(nextTenant);
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "assignment",
    `${nextTenant.name} added to resident pipeline`,
    session!.name,
    nextTenant.roomId !== "unassigned"
      ? "Room reserved pending invite acceptance"
      : "Assignment pending",
  );
  nextWorkspace.notifications = prependDormNotifications(
    nextWorkspace,
    dorm.id,
    [
      createNotification({
        dormId: dorm.id,
        type: "assignment",
        eventType: "tenant-invitation-created",
        message: `Invitation created for ${nextTenant.name}`,
        actor: session!.name,
        meta:
          nextTenant.roomId !== "unassigned"
            ? "Resident onboarding with a reserved room"
            : "Resident onboarding pending assignment",
        tenantIds: [nextTenant.id],
        chefVisible: false,
      }),
      ...(nextTenant.roomId !== "unassigned"
        ? [
            createNotification({
              dormId: dorm.id,
              type: "assignment",
              eventType: "room-assignment-changed",
              message: `${nextTenant.name} assigned to a room`,
              actor: session!.name,
              meta: `Room ${requireRoom(nextWorkspace, dorm.id, nextTenant.roomId).roomNumber}`,
              tenantIds: [nextTenant.id],
              chefVisible: false,
            }),
          ]
        : []),
    ],
  );

  const invitationResult = authService.createInvitation(auth, {
    dorm: mapDormToAuthDorm(dorm),
    email: nextTenant.email,
    role: "Tenant",
    invitedByUserId: session!.user.id,
    targetRecordId: nextTenant.id,
  });

  return {
    auth: invitationResult.snapshot,
    invitation: invitationResult.invitation,
    workspace: syncWorkspaceState(nextWorkspace),
    value: nextTenant,
  };
}

export function createChefWithInvitation(params: {
  auth: AuthStoreSnapshot;
  authService: AuthService;
  session: DemoSession | null;
  workspace: DemoWorkspaceState;
  input: CreateChefWithInvitationInput;
}): AppMutationResult<ChefMember> {
  const { auth, authService, session, workspace, input } = params;
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  requireModuleEnabled(workspace, dorm.id, "mealService");
  requireUniqueChefEmail(workspace, dorm.id, input.email);

  const nextChef: ChefMember = {
    id: createRecordId("chef"),
    dormId: dorm.id,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    specialty: input.specialty.trim(),
    shift: input.shift,
    status: "Invited",
    invitationLifecycleState: "pending",
  };

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.chefs.unshift(nextChef);
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "assignment",
    `${nextChef.name} invited to kitchen team`,
    session!.name,
    nextChef.shift,
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dorm.id, [
    createNotification({
      dormId: dorm.id,
      type: "meal",
      eventType: "chef-invitation-created",
      message: `${nextChef.name} invited to kitchen operations`,
      actor: session!.name,
      meta: `${nextChef.shift} shift`,
      tenantIds: [],
      chefVisible: false,
    }),
  ]);

  const invitationResult = authService.createInvitation(auth, {
    dorm: mapDormToAuthDorm(dorm),
    email: nextChef.email,
    role: "Chef",
    invitedByUserId: session!.user.id,
    targetRecordId: nextChef.id,
  });

  return {
    auth: invitationResult.snapshot,
    invitation: invitationResult.invitation,
    workspace: syncWorkspaceState(nextWorkspace),
    value: nextChef,
  };
}

export function reInviteChefWithInvitation(params: {
  auth: AuthStoreSnapshot;
  authService: AuthService;
  session: DemoSession | null;
  workspace: DemoWorkspaceState;
  chefId: string;
}): AppMutationResult<ChefMember> {
  const { auth, authService, chefId, session, workspace } = params;
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  requireModuleEnabled(workspace, dorm.id, "mealService");

  const chef = workspace.chefs.find(
    (candidate) => candidate.id === chefId && candidate.dormId === dorm.id,
  );
  if (!chef) {
    throw new DomainError(
      "CHEF_NOT_FOUND",
      "Chef record was not found in the active dorm.",
    );
  }

  if (chef.invitationLifecycleState === "pending") {
    throw new DomainError(
      "INVITATION_PENDING",
      "This chef already has a pending invitation.",
    );
  }

  const hasExistingAccount =
    auth.chefProfiles.some(
      (profile) => profile.chefId === chef.id && profile.dormId === dorm.id,
    ) ||
    auth.memberships.some((membership) => {
      if (membership.dormId !== dorm.id || membership.role !== "Chef") {
        return false;
      }

      const user = auth.users.find(
        (candidate) => candidate.id === membership.userId,
      );
      return Boolean(user && normalizeEmail(user.email) === chef.email);
    });
  if (hasExistingAccount) {
    throw new DomainError(
      "CHEF_ACCOUNT_EXISTS",
      "This chef already has a dorm account. Reactivate the record instead of sending a new invitation.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.chefs = nextWorkspace.chefs.map((candidate) =>
    candidate.id === chef.id
      ? {
          ...candidate,
          status: "Invited",
          invitationLifecycleState: "pending",
        }
      : candidate,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "assignment",
    `${chef.name} re-invited to kitchen team`,
    session!.name,
    chef.shift,
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dorm.id, [
    createNotification({
      dormId: dorm.id,
      type: "meal",
      eventType: "chef-invitation-created",
      message: `${chef.name} re-invited to kitchen operations`,
      actor: session!.name,
      meta: `${chef.shift} shift`,
      tenantIds: [],
      chefVisible: false,
    }),
  ]);

  const invitationResult = authService.createInvitation(auth, {
    dorm: mapDormToAuthDorm(dorm),
    email: chef.email,
    role: "Chef",
    invitedByUserId: session!.user.id,
    targetRecordId: chef.id,
  });

  return {
    auth: invitationResult.snapshot,
    invitation: invitationResult.invitation,
    workspace: syncWorkspaceState(nextWorkspace),
    value: {
      ...chef,
      status: "Invited",
      invitationLifecycleState: "pending",
    },
  };
}

export function activateAcceptedInvitationTarget(
  workspace: DemoWorkspaceState,
  invitation: Invitation | undefined,
  actorName?: string,
): DemoWorkspaceState {
  if (!invitation?.targetRecordId) {
    return workspace;
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  if (invitation.role === "Tenant") {
    const tenant = nextWorkspace.tenants.find(
      (candidate) => candidate.id === invitation.targetRecordId,
    );
    if (tenant) {
      let nextRoomId = tenant.roomId;
      let activationMeta =
        tenant.roomId !== "unassigned"
          ? "Resident activated"
          : "No room assigned yet";

      // Pending invites can reserve capacity ahead of acceptance, but the
      // final activation still revalidates the room to avoid silently leaving
      // a resident inside a broken or overbooked assignment.
      if (tenant.roomId !== "unassigned") {
        try {
          assertRoomAssignable(
            nextWorkspace,
            tenant.dormId,
            tenant.roomId,
            tenant.id,
            { allowReservedCurrentAssignment: true },
          );
        } catch {
          nextRoomId = "unassigned";
          activationMeta =
            "Resident activated without room assignment; reassignment required";
        }
      }

      nextWorkspace.tenants = nextWorkspace.tenants.map((candidate) =>
        candidate.id === invitation.targetRecordId
          ? {
              ...candidate,
              roomId: nextRoomId,
              status: "Active",
              invitationLifecycleState: undefined,
            }
          : candidate,
      );
      nextWorkspace.activityFeed = appendActivityItem(
        nextWorkspace.activityFeed,
        tenant.dormId,
        "assignment",
        `${tenant.name} accepted the invitation`,
        actorName ?? tenant.name,
        activationMeta,
      );
      nextWorkspace.notifications = prependDormNotifications(
        nextWorkspace,
        tenant.dormId,
        [
          createNotification({
            dormId: tenant.dormId,
            type: "assignment",
            eventType: "invitation-accepted",
            message: `${tenant.name} accepted the invitation`,
            actor: actorName ?? tenant.name,
            meta: activationMeta,
            tenantIds: [tenant.id],
            chefVisible: false,
          }),
          ...(nextRoomId === "unassigned" && tenant.roomId !== "unassigned"
            ? [
                createNotification({
                  dormId: tenant.dormId,
                  type: "assignment",
                  eventType: "room-assignment-changed",
                  message: `${tenant.name} needs a new room assignment`,
                  actor: "System",
                  meta: "Reserved room was no longer assignable at acceptance",
                  tenantIds: [tenant.id],
                  chefVisible: false,
                }),
              ]
            : []),
        ],
      );
    }
  } else {
    const chef = nextWorkspace.chefs.find(
      (candidate) => candidate.id === invitation.targetRecordId,
    );
    nextWorkspace.chefs = nextWorkspace.chefs.map((chef) =>
      chef.id === invitation.targetRecordId
        ? {
            ...chef,
            status: "Active",
            invitationLifecycleState: undefined,
          }
        : chef,
    );
    if (chef) {
      nextWorkspace.activityFeed = appendActivityItem(
        nextWorkspace.activityFeed,
        chef.dormId,
        "assignment",
        `${chef.name} accepted the invitation`,
        actorName ?? chef.name,
        "Kitchen staff activated",
      );
      nextWorkspace.notifications = prependDormNotifications(
        nextWorkspace,
        chef.dormId,
        [
          createNotification({
            dormId: chef.dormId,
            type: "assignment",
            eventType: "invitation-accepted",
            message: `${chef.name} accepted the invitation`,
            actor: actorName ?? chef.name,
            meta: "Kitchen staff activated",
            tenantIds: [],
            chefVisible: false,
          }),
        ],
      );
    }
  }

  return syncWorkspaceState(nextWorkspace);
}

export function reconcileWorkspaceInvitationLifecycle(
  workspace: DemoWorkspaceState,
  auth: AuthStoreSnapshot | null,
): DemoWorkspaceState {
  if (!auth) {
    return workspace;
  }

  const invitationsByTargetId = new Map<string, Invitation>();
  auth.invitations.forEach((invitation) => {
    if (!invitation.targetRecordId) {
      return;
    }

    const existing = invitationsByTargetId.get(invitation.targetRecordId);
    if (
      !existing ||
      new Date(invitation.createdAt).getTime() >=
        new Date(existing.createdAt).getTime()
    ) {
      invitationsByTargetId.set(invitation.targetRecordId, invitation);
    }
  });

  const nextWorkspace = cloneWorkspaceState(workspace);
  let changed = false;
  const removedTenantIds = new Set<string>();

  nextWorkspace.tenants = nextWorkspace.tenants.filter((tenant) => {
    const invitation = invitationsByTargetId.get(tenant.id);
    const hasProfile = auth.tenantProfiles.some(
      (profile) =>
        profile.tenantId === tenant.id && profile.dormId === tenant.dormId,
    );

    if (!invitation) {
      if (tenant.invitationLifecycleState === "pending" && !hasProfile) {
        changed = true;
        removedTenantIds.add(tenant.id);
        nextWorkspace.activityFeed = appendActivityItem(
          nextWorkspace.activityFeed,
          tenant.dormId,
          "assignment",
          `Pending invitation record removed for ${tenant.name}`,
          "System",
          "Linked invitation was no longer available",
        );
        return false;
      }

      return true;
    }

    if (invitation.status === "pending") {
      if (
        tenant.status !== "Inactive" ||
        tenant.invitationLifecycleState !== "pending"
      ) {
        changed = true;
        tenant.status = "Inactive";
        tenant.invitationLifecycleState = "pending";
      }
      return true;
    }

    if (invitation.status === "accepted") {
      if (
        tenant.status !== "Active" ||
        tenant.invitationLifecycleState !== undefined
      ) {
        changed = true;
        tenant.status = "Active";
        tenant.invitationLifecycleState = undefined;
      }
      return true;
    }

    if (!hasProfile) {
      changed = true;
      removedTenantIds.add(tenant.id);
      const actor = resolveAuthUserName(
        auth,
        invitation.revokedByUserId,
        invitation.status === "expired" ? "System" : "Admin",
      );
      nextWorkspace.activityFeed = appendActivityItem(
        nextWorkspace.activityFeed,
        tenant.dormId,
        "assignment",
        `Invitation ${invitation.status} for ${tenant.name}`,
        actor,
        "Pending resident placeholder removed",
      );
      nextWorkspace.notifications = prependDormNotifications(
        nextWorkspace,
        tenant.dormId,
        [
          createNotification({
            dormId: tenant.dormId,
            type: "assignment",
            eventType:
              invitation.status === "expired"
                ? "invitation-expired"
                : "invitation-revoked",
            message: `${tenant.name}'s invitation ${invitation.status}`,
            actor,
            meta: "Pending resident placeholder removed",
            tenantIds: [tenant.id],
            chefVisible: false,
          }),
        ],
      );
      return false;
    }

    if (tenant.invitationLifecycleState !== undefined) {
      changed = true;
      tenant.invitationLifecycleState = undefined;
    }
    return true;
  });

  nextWorkspace.chefs = nextWorkspace.chefs.filter((chef) => {
    const invitation = invitationsByTargetId.get(chef.id);
    const hasProfile = auth.chefProfiles.some(
      (profile) => profile.chefId === chef.id && profile.dormId === chef.dormId,
    );

    if (!invitation) {
      if (chef.invitationLifecycleState === "pending" && !hasProfile) {
        changed = true;
        nextWorkspace.activityFeed = appendActivityItem(
          nextWorkspace.activityFeed,
          chef.dormId,
          "assignment",
          `Pending invitation record removed for ${chef.name}`,
          "System",
          "Linked invitation was no longer available",
        );
        return false;
      }

      return true;
    }

    if (invitation.status === "pending") {
      if (
        chef.status !== "Invited" ||
        chef.invitationLifecycleState !== "pending"
      ) {
        changed = true;
        chef.status = "Invited";
        chef.invitationLifecycleState = "pending";
      }
      return true;
    }

    if (invitation.status === "accepted") {
      if (
        chef.status !== "Active" ||
        chef.invitationLifecycleState !== undefined
      ) {
        changed = true;
        chef.status = "Active";
        chef.invitationLifecycleState = undefined;
      }
      return true;
    }

    if (!hasProfile) {
      changed = true;
      const actor = resolveAuthUserName(
        auth,
        invitation.revokedByUserId,
        invitation.status === "expired" ? "System" : "Admin",
      );
      nextWorkspace.activityFeed = appendActivityItem(
        nextWorkspace.activityFeed,
        chef.dormId,
        "assignment",
        `Invitation ${invitation.status} for ${chef.name}`,
        actor,
        "Pending chef placeholder removed",
      );
      nextWorkspace.notifications = prependDormNotifications(
        nextWorkspace,
        chef.dormId,
        [
          createNotification({
            dormId: chef.dormId,
            type: "assignment",
            eventType:
              invitation.status === "expired"
                ? "invitation-expired"
                : "invitation-revoked",
            message: `${chef.name}'s invitation ${invitation.status}`,
            actor,
            meta: "Pending chef placeholder removed",
            tenantIds: [],
            chefVisible: false,
          }),
        ],
      );
      return false;
    }

    if (chef.invitationLifecycleState !== undefined) {
      changed = true;
      chef.invitationLifecycleState = undefined;
    }
    return true;
  });

  if (removedTenantIds.size > 0) {
    nextWorkspace.tenantMealPreferences =
      nextWorkspace.tenantMealPreferences.filter(
        (preference) => !removedTenantIds.has(preference.tenantId),
      );
  }

  return changed ? syncWorkspaceState(nextWorkspace) : workspace;
}

export function syncSessionProfileRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  updates: { name?: string; email?: string },
): DemoWorkspaceState {
  if (!session) {
    return workspace;
  }

  const nextName = updates.name?.trim() || undefined;
  const nextEmail = updates.email?.trim()
    ? normalizeEmail(updates.email)
    : undefined;

  if (!nextName && !nextEmail) {
    return workspace;
  }

  if (session.role === "Tenant" && session.tenantId) {
    let changed = false;
    const nextTenants = workspace.tenants.map((tenant) => {
      if (
        tenant.id !== session.tenantId ||
        tenant.dormId !== session.activeDorm.id
      ) {
        return tenant;
      }

      const updatedTenant = {
        ...tenant,
        name: nextName ?? tenant.name,
        email: nextEmail ?? tenant.email,
        avatar: nextName ? createAvatar(nextName) : tenant.avatar,
      };
      const tenantChanged =
        updatedTenant.name !== tenant.name ||
        updatedTenant.email !== tenant.email ||
        updatedTenant.avatar !== tenant.avatar;

      changed = changed || tenantChanged;
      return tenantChanged ? updatedTenant : tenant;
    });

    return changed
      ? syncWorkspaceState({ ...workspace, tenants: nextTenants })
      : workspace;
  }

  if (session.role === "Chef" && session.chefId) {
    let changed = false;
    const nextChefs = workspace.chefs.map((chef) => {
      if (chef.id !== session.chefId || chef.dormId !== session.activeDorm.id) {
        return chef;
      }

      const updatedChef = {
        ...chef,
        name: nextName ?? chef.name,
        email: nextEmail ?? chef.email,
      };
      const chefChanged =
        updatedChef.name !== chef.name || updatedChef.email !== chef.email;

      changed = changed || chefChanged;
      return chefChanged ? updatedChef : chef;
    });

    return changed
      ? syncWorkspaceState({ ...workspace, chefs: nextChefs })
      : workspace;
  }

  return workspace;
}

export function updateTenantStatusRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  tenantId: string,
  status: Tenant["status"],
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const tenant = workspace.tenants.find(
    (candidate) => candidate.id === tenantId && candidate.dormId === dorm.id,
  );
  if (!tenant) {
    throw new DomainError(
      "TENANT_NOT_FOUND",
      "Resident record was not found in the active dorm.",
    );
  }

  if (tenant.invitationLifecycleState === "pending") {
    throw new DomainError(
      "INVITATION_PENDING",
      "Residents with pending invitations cannot be activated or deactivated yet.",
    );
  }

  if (status === "Active") {
    assertRoomAssignable(workspace, dorm.id, tenant.roomId, tenant.id, {
      allowReservedCurrentAssignment: true,
    });
  }

  const nextRoomId = status === "Inactive" ? "unassigned" : tenant.roomId;
  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.tenants = nextWorkspace.tenants.map((candidate) =>
    candidate.id === tenantId
      ? { ...candidate, status, roomId: nextRoomId }
      : candidate,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "assignment",
    `${tenant.name} marked ${status.toLowerCase()}`,
    session!.name,
    status === "Inactive" && tenant.roomId !== "unassigned"
      ? "Room assignment released"
      : nextRoomId !== "unassigned"
        ? "Resident assignment updated"
        : "Awaiting reassignment",
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dorm.id, [
    createNotification({
      dormId: dorm.id,
      type: "assignment",
      eventType: "tenant-status-changed",
      message: `${tenant.name} marked ${status.toLowerCase()}`,
      actor: session!.name,
      meta:
        status === "Inactive" && tenant.roomId !== "unassigned"
          ? "Room assignment released"
          : nextRoomId !== "unassigned"
            ? "Resident remains assigned"
            : "No room assigned",
      tenantIds: [tenant.id],
      chefVisible: false,
    }),
  ]);

  return syncWorkspaceState(nextWorkspace);
}

export function reassignTenantRoomRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  tenantId: string,
  roomId: string,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const tenant = workspace.tenants.find(
    (candidate) => candidate.id === tenantId && candidate.dormId === dorm.id,
  );
  if (!tenant) {
    throw new DomainError(
      "TENANT_NOT_FOUND",
      "Resident record was not found in the active dorm.",
    );
  }

  if (!roomId || roomId === "unassigned") {
    throw new DomainError(
      "ROOM_ASSIGNMENT_REQUIRED",
      "Select a valid room before saving the reassignment.",
    );
  }

  if (
    tenant.status !== "Active" &&
    tenant.invitationLifecycleState !== "pending"
  ) {
    throw new DomainError(
      "TENANT_NOT_ASSIGNABLE",
      "Only active residents or pending invited residents can hold a room assignment.",
    );
  }

  if (tenant.roomId === roomId) {
    throw new DomainError(
      "ROOM_ASSIGNMENT_UNCHANGED",
      "Resident is already assigned to that room.",
    );
  }

  const nextRoom = requireRoom(workspace, dorm.id, roomId);
  const previousRoom =
    tenant.roomId && tenant.roomId !== "unassigned"
      ? workspace.rooms.find(
          (candidate) =>
            candidate.id === tenant.roomId && candidate.dormId === dorm.id,
        ) ?? null
      : null;

  assertRoomAssignable(workspace, dorm.id, roomId, tenant.id);

  const nextWorkspace = cloneWorkspaceState(workspace);
  const timestamp = formatDate(new Date());
  nextWorkspace.tenants = nextWorkspace.tenants.map((candidate) =>
    candidate.id === tenantId ? { ...candidate, roomId: nextRoom.id } : candidate,
  );
  nextWorkspace.rooms = nextWorkspace.rooms.map((room) =>
    room.id === nextRoom.id || room.id === previousRoom?.id
      ? { ...room, lastUpdated: timestamp }
      : room,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "assignment",
    previousRoom
      ? `${tenant.name} moved to Room ${nextRoom.roomNumber}`
      : `${tenant.name} assigned to Room ${nextRoom.roomNumber}`,
    session!.name,
    previousRoom
      ? `Room ${previousRoom.roomNumber} → Room ${nextRoom.roomNumber}`
      : "Initial room assignment",
  );
  nextWorkspace.notifications = prependDormNotifications(
    nextWorkspace,
    dorm.id,
    [
      createNotification({
        dormId: dorm.id,
        type: "assignment",
        eventType: "room-assignment-changed",
        message: previousRoom
          ? `${tenant.name} moved to Room ${nextRoom.roomNumber}`
          : `${tenant.name} assigned to Room ${nextRoom.roomNumber}`,
        actor: session!.name,
        meta: previousRoom
          ? `Previous room: ${previousRoom.roomNumber}`
          : `Room ${nextRoom.roomNumber}`,
        tenantIds: [tenant.id],
        chefVisible: false,
      }),
    ],
  );

  // Occupancy and room status remain derived from committed assignments so
  // pending invite reservations and accepted tenants always converge safely.
  return syncWorkspaceState(nextWorkspace);
}

export function updateChefStatusRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  chefId: string,
  status: ChefMember["status"],
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  if (status !== "Inactive") {
    requireModuleEnabled(workspace, dorm.id, "mealService");
  }

  const chef = workspace.chefs.find(
    (candidate) => candidate.id === chefId && candidate.dormId === dorm.id,
  );
  if (!chef) {
    throw new DomainError(
      "CHEF_NOT_FOUND",
      "Chef record was not found in the active dorm.",
    );
  }

  if (chef.invitationLifecycleState === "pending") {
    throw new DomainError(
      "INVITATION_PENDING",
      "Chefs with pending invitations cannot change status until the invite is accepted or revoked.",
    );
  }

  if (status === "Invited") {
    throw new DomainError(
      "CHEF_REINVITE_REQUIRED",
      "Use the chef re-invite flow to create a real new kitchen invitation.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.chefs = nextWorkspace.chefs.map((candidate) =>
    candidate.id === chefId ? { ...candidate, status } : candidate,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "assignment",
    `${chef.name} status changed to ${status}`,
    session!.name,
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dorm.id, [
    createNotification({
      dormId: dorm.id,
      type: "meal",
      eventType: "chef-status-changed",
      message: `${chef.name} marked ${status.toLowerCase()}`,
      actor: session!.name,
      meta: chef.shift,
      tenantIds: [],
      chefVisible: false,
    }),
  ]);

  return syncWorkspaceState(nextWorkspace);
}

export function addRoomRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  room: Room,
): WorkspaceMutationResult<WorkspaceRoomRecord> {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const nextRoom = normalizeRoomRecord(room, dorm.id);

  const duplicateRoomNumber = workspace.rooms.some(
    (candidate) =>
      candidate.dormId === dorm.id &&
      candidate.roomNumber === nextRoom.roomNumber,
  );
  if (duplicateRoomNumber) {
    throw new DomainError(
      "ROOM_NUMBER_CONFLICT",
      "Room numbers must be unique inside a dorm.",
    );
  }

  if (nextRoom.capacity < 1) {
    throw new DomainError(
      "ROOM_CAPACITY_INVALID",
      "Room capacity must be at least 1.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.rooms.unshift(nextRoom);
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "room",
    `Room ${nextRoom.roomNumber} added`,
    session!.name,
    nextRoom.type,
  );

  return { workspace: syncWorkspaceState(nextWorkspace), value: nextRoom };
}

export function updateRoomRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  room: Room,
): WorkspaceMutationResult<WorkspaceRoomRecord> {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const existingRoom = requireRoom(workspace, dorm.id, room.id);
  const activeOccupants = countActiveOccupants(workspace, room.id);
  const committedOccupants = countCommittedOccupants(workspace, room.id);
  const pendingReservations = committedOccupants - activeOccupants;

  if (room.capacity < committedOccupants) {
    throw new DomainError(
      "ROOM_CAPACITY_EXCEEDED",
      "Room capacity cannot be reduced below committed occupancy.",
    );
  }

  if (room.status === "Under Maintenance" && committedOccupants > 0) {
    throw new DomainError(
      "ROOM_STATUS_CONFLICT",
      "Rooms with committed residents cannot be placed under maintenance.",
    );
  }

  if (room.status === "Reserved" && activeOccupants > 0) {
    throw new DomainError(
      "ROOM_STATUS_CONFLICT",
      "Occupied rooms cannot be manually reserved.",
    );
  }

  if (room.status === "Available" && pendingReservations > 0) {
    throw new DomainError(
      "ROOM_STATUS_CONFLICT",
      "Rooms with pending resident reservations cannot be marked available.",
    );
  }

  const duplicateRoomNumber = workspace.rooms.some(
    (candidate) =>
      candidate.dormId === dorm.id &&
      candidate.roomNumber === room.roomNumber &&
      candidate.id !== room.id,
  );
  if (duplicateRoomNumber) {
    throw new DomainError(
      "ROOM_NUMBER_CONFLICT",
      "Room numbers must be unique inside a dorm.",
    );
  }

  const nextRoom: WorkspaceRoomRecord = {
    ...existingRoom,
    ...room,
    dormId: dorm.id,
  };

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.rooms = nextWorkspace.rooms.map((candidate) =>
    candidate.id === room.id ? nextRoom : candidate,
  );

  return { workspace: syncWorkspaceState(nextWorkspace), value: nextRoom };
}

export function deleteRoomRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  roomId: string,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const targetRoom = requireRoom(workspace, dorm.id, roomId);
  const linkedResidents = workspace.tenants.filter(
    (tenant) => tenant.dormId === dorm.id && tenant.roomId === roomId,
  );
  if (linkedResidents.length > 0) {
    throw new DomainError(
      "ROOM_DELETE_BLOCKED",
      "This room still has resident assignments or reservations. Move those residents first.",
    );
  }

  if (
    workspace.maintenanceTickets.some(
      (ticket) => ticket.dormId === dorm.id && ticket.roomId === roomId,
    )
  ) {
    throw new DomainError(
      "ROOM_DELETE_BLOCKED",
      "This room has maintenance history. Keep it and mark the room unavailable instead of deleting it.",
    );
  }

  if (
    workspace.invoices.some(
      (invoice) =>
        invoice.dormId === dorm.id &&
        invoice.roomNumber === targetRoom.roomNumber,
    )
  ) {
    throw new DomainError(
      "ROOM_DELETE_BLOCKED",
      "This room appears in billing history. Keep the room record and change its status instead of deleting it.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.rooms = nextWorkspace.rooms.filter(
    (room) => room.id !== roomId,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "room",
    `Room ${targetRoom.roomNumber} removed`,
    session!.name,
    "No residents or history were linked to the room",
  );

  return syncWorkspaceState(nextWorkspace);
}

export function updateRoomStatusRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  roomId: string,
  status: RoomStatus,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const targetRoom = requireRoom(workspace, dorm.id, roomId);
  const activeOccupants = countActiveOccupants(workspace, roomId);
  const committedOccupants = countCommittedOccupants(workspace, roomId);
  const pendingReservations = committedOccupants - activeOccupants;

  if (status === targetRoom.status) {
    return workspace;
  }

  if (status === "Under Maintenance" && committedOccupants > 0) {
    throw new DomainError(
      "ROOM_STATUS_CONFLICT",
      "Rooms with committed residents cannot be placed under maintenance.",
    );
  }

  if (status === "Reserved" && activeOccupants > 0) {
    throw new DomainError(
      "ROOM_STATUS_CONFLICT",
      "Occupied rooms cannot be manually reserved.",
    );
  }

  if (status === "Available" && pendingReservations > 0) {
    throw new DomainError(
      "ROOM_STATUS_CONFLICT",
      "Rooms with pending resident reservations cannot be marked available.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.rooms = nextWorkspace.rooms.map((room) =>
    room.id === roomId
      ? { ...room, status, lastUpdated: formatDate(new Date()) }
      : room,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "room",
    `Room ${targetRoom.roomNumber} status updated`,
    session!.name,
    status,
  );
  const affectedTenants = workspace.tenants.filter(
    (tenant) => tenant.dormId === dorm.id && tenant.roomId === roomId,
  );
  if (affectedTenants.length > 0) {
    nextWorkspace.notifications = prependDormNotifications(
      nextWorkspace,
      dorm.id,
      [
        createNotification({
          dormId: dorm.id,
          type: "assignment",
          eventType: "room-status-changed",
          message: `Room ${targetRoom.roomNumber} status changed to ${status}`,
          actor: session!.name,
          meta: "Review current resident assignment",
          tenantIds: affectedTenants.map((tenant) => tenant.id),
          chefVisible: false,
        }),
      ],
    );
  }

  return syncWorkspaceState(nextWorkspace);
}

export function generateInvoicesForCurrentDorm(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  period = "May 2026",
): WorkspaceMutationResult<number> {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const nextWorkspace = cloneWorkspaceState(workspace);
  const billing = buildBillingDates(period);
  const existingKeys = new Set(
    nextWorkspace.invoices
      .filter((invoice) => invoice.dormId === dorm.id)
      .map(
        (invoice) =>
          `${invoice.tenantId}:${invoice.billingPeriodKey ?? buildBillingPeriodKey(invoice.period)}`,
      ),
  );

  const eligibleTenants = nextWorkspace.tenants.filter(
    (tenant) =>
      tenant.dormId === dorm.id &&
      tenant.status === "Active" &&
      tenant.roomId !== "unassigned",
  );

  const newInvoices: WorkspaceInvoiceRecord[] = [];
  eligibleTenants.forEach((tenant) => {
    const room = nextWorkspace.rooms.find(
      (candidate) =>
        candidate.id === tenant.roomId && candidate.dormId === dorm.id,
    );
    if (!room) {
      return;
    }

    const uniquenessKey = `${tenant.id}:${billing.billingPeriodKey}`;
    if (existingKeys.has(uniquenessKey)) {
      return;
    }

    existingKeys.add(uniquenessKey);
    newInvoices.push({
      id: createRecordId("inv", tenant.id),
      dormId: dorm.id,
      tenantId: tenant.id,
      tenantName: tenant.name,
      roomNumber: room.roomNumber,
      amount: room.rentPerMonth,
      dueDate: billing.dueDate,
      issuedDate: billing.issuedDate,
      status: "Issued",
      period,
      billingPeriodKey: billing.billingPeriodKey,
    });
  });

  if (newInvoices.length === 0) {
    return { workspace, value: 0 };
  }

  nextWorkspace.invoices = [...newInvoices, ...nextWorkspace.invoices];
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "invoice",
    `Invoices generated for ${period}`,
    "System",
    `${newInvoices.length} invoice${newInvoices.length === 1 ? "" : "s"}`,
  );
  nextWorkspace.notifications = prependDormNotifications(
    nextWorkspace,
    dorm.id,
    newInvoices.map((invoice) =>
      createNotification({
        dormId: dorm.id,
        type: "invoice",
        eventType: "invoice-generated",
        message: `Invoice issued for ${invoice.period}`,
        actor: "System",
        meta: `Room ${invoice.roomNumber} · ${formatCurrency(invoice.amount)}`,
        tenantIds: [invoice.tenantId],
        chefVisible: false,
      }),
    ),
  );

  return {
    workspace: syncWorkspaceState(nextWorkspace),
    value: newInvoices.length,
  };
}

export function recordInvoicePaymentRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  invoiceId: string,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Tenant",
  ]);
  const invoice = workspace.invoices.find(
    (candidate) => candidate.id === invoiceId && candidate.dormId === dorm.id,
  );
  if (!invoice) {
    throw new DomainError(
      "INVOICE_NOT_FOUND",
      "Invoice not found in the active dorm.",
    );
  }

  if (session!.role === "Tenant" && session!.tenantId !== invoice.tenantId) {
    throw new DomainError(
      "FORBIDDEN",
      "Tenants can only pay invoices tied to their own account.",
    );
  }

  if (invoice.status === "Draft") {
    throw new DomainError(
      "INVOICE_NOT_READY",
      "Draft invoices cannot accept payments yet.",
    );
  }

  const latestSettlement = getLatestSettlementPayment(
    workspace.payments,
    invoiceId,
  );
  if (latestSettlement?.status === "paid") {
    return workspace;
  }

  const pendingPayment = getLatestInvoicePayment(workspace.payments, invoiceId, [
    "pending",
  ]);
  const nextWorkspace = cloneWorkspaceState(workspace);
  const recordedAt = new Date().toISOString();

  if (session!.role === "Tenant") {
    if (pendingPayment) {
      throw new DomainError(
        "PAYMENT_ALREADY_PENDING",
        "A payment for this invoice is already under review.",
      );
    }

    nextWorkspace.payments.unshift(
      createInvoicePaymentRecord({
        invoice,
        actor: session!,
        status: "pending",
        initiatedAt: recordedAt,
        methodLabel: "Submitted from tenant portal",
        note: "Payment submitted and waiting for owner confirmation",
      }),
    );
    const submittedPayment = getLatestInvoicePayment(
      nextWorkspace.payments,
      invoiceId,
      ["pending"],
    );
    nextWorkspace.activityFeed = appendActivityItem(
      nextWorkspace.activityFeed,
      dorm.id,
      "payment",
      `Payment submitted for Room ${invoice.roomNumber}`,
      session!.name,
      `${formatCurrency(invoice.amount)} · ${submittedPayment?.reference ?? "Awaiting review"}`,
    );
    nextWorkspace.notifications = prependDormNotifications(
      nextWorkspace,
      dorm.id,
      [
        createNotification({
          dormId: dorm.id,
          type: "invoice",
          eventType: "invoice-payment-submitted",
          message: `Payment submitted for ${invoice.period}`,
          actor: session!.name,
          meta: `Room ${invoice.roomNumber} · ${formatCurrency(invoice.amount)} · awaiting confirmation`,
          tenantIds: [invoice.tenantId],
          chefVisible: false,
        }),
      ],
    );
    return syncWorkspaceState(nextWorkspace);
  }

  if (pendingPayment) {
    nextWorkspace.payments = nextWorkspace.payments.map((payment) =>
      payment.id === pendingPayment.id
        ? {
            ...payment,
            status: "paid",
            completedAt: recordedAt,
            recordedByUserId: session!.user.id,
            recordedByName: session!.name,
            note: "Payment confirmed by the dorm owner",
            failureReason: undefined,
          }
        : payment,
    );
  } else {
    nextWorkspace.payments.unshift(
      createInvoicePaymentRecord({
        invoice,
        actor: session!,
        status: "paid",
        initiatedAt: recordedAt,
        completedAt: recordedAt,
        note: "Payment manually confirmed by the dorm owner",
      }),
    );
  }

  const recordedPayment = getLatestInvoicePayment(nextWorkspace.payments, invoiceId, [
    "paid",
  ]);
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "payment",
    `Payment confirmed for Room ${invoice.roomNumber}`,
    session!.name,
    `${formatCurrency(invoice.amount)} · ${recordedPayment?.reference ?? "Recorded payment"}`,
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dorm.id, [
    createNotification({
      dormId: dorm.id,
      type: "invoice",
      eventType: "invoice-paid",
      message: `Payment confirmed for ${invoice.period}`,
      actor: session!.name,
      meta: `Room ${invoice.roomNumber} · ${formatCurrency(invoice.amount)} · ${recordedPayment?.reference ?? "Receipt ready"}`,
      tenantIds: [invoice.tenantId],
      chefVisible: false,
    }),
  ]);

  return syncWorkspaceState(nextWorkspace);
}

export function rejectInvoicePaymentRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  invoiceId: string,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const invoice = workspace.invoices.find(
    (candidate) => candidate.id === invoiceId && candidate.dormId === dorm.id,
  );
  if (!invoice) {
    throw new DomainError(
      "INVOICE_NOT_FOUND",
      "Invoice not found in the active dorm.",
    );
  }

  const pendingPayment = getLatestInvoicePayment(workspace.payments, invoiceId, [
    "pending",
  ]);
  if (!pendingPayment) {
    throw new DomainError(
      "PAYMENT_NOT_PENDING",
      "There is no submitted payment waiting for review on this invoice.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  const reviewedAt = new Date().toISOString();
  nextWorkspace.payments = nextWorkspace.payments.map((payment) =>
    payment.id === pendingPayment.id
      ? {
          ...payment,
          status: "failed",
          completedAt: reviewedAt,
          recordedByUserId: session!.user.id,
          recordedByName: session!.name,
          note: "Payment submission rejected during owner review",
          failureReason: "Submission rejected during manual review",
        }
      : payment,
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "payment",
    `Payment review rejected for Room ${invoice.roomNumber}`,
    session!.name,
    `${formatCurrency(invoice.amount)} · ${pendingPayment.reference}`,
  );
  nextWorkspace.notifications = prependDormNotifications(nextWorkspace, dorm.id, [
    createNotification({
      dormId: dorm.id,
      type: "invoice",
      eventType: "invoice-payment-rejected",
      message: `Payment review rejected for ${invoice.period}`,
      actor: session!.name,
      meta: `Room ${invoice.roomNumber} · ${formatCurrency(invoice.amount)}`,
      tenantIds: [invoice.tenantId],
      chefVisible: false,
    }),
  ]);

  return syncWorkspaceState(nextWorkspace);
}

export function createMaintenanceTicketRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  input: AddMaintenanceTicketInput,
): WorkspaceMutationResult<WorkspaceMaintenanceRecord> {
  const { dorm, membership } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Tenant",
  ]);
  const room = requireRoom(workspace, dorm.id, input.roomId);

  if (!input.title.trim()) {
    throw new DomainError(
      "MAINTENANCE_TITLE_REQUIRED",
      "A maintenance title is required.",
    );
  }

  let ticketTenant =
    input.tenantId
      ? workspace.tenants.find(
          (candidate) =>
            candidate.id === input.tenantId && candidate.dormId === dorm.id,
        ) ?? null
      : null;

  if (input.tenantId && !ticketTenant) {
    throw new DomainError(
      "TENANT_NOT_FOUND",
      "Resident record was not found in the active dorm.",
    );
  }

  if (session!.role === "Tenant") {
    const tenantId = session!.tenantId;
    if (!tenantId) {
      throw new DomainError(
        "TENANT_PROFILE_MISSING",
        "Tenant account is missing its resident profile.",
      );
    }

    const tenant = workspace.tenants.find(
      (candidate) => candidate.id === tenantId && candidate.dormId === dorm.id,
    );
    if (!tenant) {
      throw new DomainError(
        "TENANT_NOT_FOUND",
        "Resident record was not found in the active dorm.",
      );
    }

    if (tenant.roomId !== input.roomId) {
      throw new DomainError(
        "FORBIDDEN",
        "Tenants can only create maintenance requests for their own room.",
      );
    }

    ticketTenant = tenant;
  } else if (ticketTenant && ticketTenant.roomId !== room.id) {
    throw new DomainError(
      "ROOM_TENANT_MISMATCH",
      "The selected resident is not assigned to that room.",
    );
  }

  const nextTicket: WorkspaceMaintenanceRecord = {
    id: createRecordId("maint"),
    dormId: dorm.id,
    title: input.title.trim(),
    roomId: room.id,
    roomNumber: room.roomNumber,
    tenantName: ticketTenant?.name ?? (input.tenantName.trim() || "Dorm Operations"),
    createdByTenantId: session!.role === "Tenant" ? ticketTenant?.id : undefined,
    createdByMembershipId: membership.id,
    priority: input.priority ?? "Medium",
    status: "Open",
    submittedDate: formatDate(new Date()),
    updatedDate: formatDate(new Date()),
    description: input.description.trim() || "No extra details provided.",
    category: input.category,
  };

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.maintenanceTickets.unshift(nextTicket);
  nextWorkspace.maintenanceStatusHistory.unshift(
    createMaintenanceHistoryEntry(
      nextTicket.id,
      dorm.id,
      undefined,
      "Open",
      session!,
      "Ticket created",
    ),
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "maintenance",
    `New maintenance request — Room ${nextTicket.roomNumber}`,
    session!.role === "Tenant" ? ticketTenant!.name : session!.name,
    session!.role === "Tenant"
      ? nextTicket.priority
      : `${nextTicket.priority}${ticketTenant ? ` · ${ticketTenant.name}` : ""}`,
  );
  nextWorkspace.notifications = prependDormNotifications(
    nextWorkspace,
    dorm.id,
    [
      createNotification({
        dormId: dorm.id,
        type: "maintenance",
        eventType: "maintenance-ticket-created",
        message: `Maintenance request created for Room ${nextTicket.roomNumber}`,
        actor: session!.role === "Tenant" ? ticketTenant!.name : session!.name,
        meta: nextTicket.priority,
        tenantIds: ticketTenant ? [ticketTenant.id] : [],
        chefVisible: false,
      }),
    ],
  );

  return { workspace: syncWorkspaceState(nextWorkspace), value: nextTicket };
}

export function updateMaintenanceTicketStatus(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  ticketId: string,
  status: MaintenanceStatus,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, ["Admin"]);
  const ticket = workspace.maintenanceTickets.find(
    (candidate) => candidate.id === ticketId && candidate.dormId === dorm.id,
  );
  if (!ticket) {
    throw new DomainError(
      "MAINTENANCE_NOT_FOUND",
      "Maintenance ticket not found in the active dorm.",
    );
  }

  if (
    !MAINTENANCE_TRANSITIONS[ticket.status].includes(status) &&
    ticket.status !== status
  ) {
    throw new DomainError(
      "MAINTENANCE_TRANSITION_INVALID",
      "That maintenance transition is not allowed.",
    );
  }

  if (ticket.status === status) {
    return workspace;
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.maintenanceTickets = nextWorkspace.maintenanceTickets.map(
    (candidate) =>
      candidate.id === ticketId
        ? { ...candidate, status, updatedDate: formatDate(new Date()) }
        : candidate,
  );
  nextWorkspace.maintenanceStatusHistory.unshift(
    createMaintenanceHistoryEntry(
      ticket.id,
      dorm.id,
      ticket.status,
      status,
      session!,
      "Status updated",
    ),
  );
  nextWorkspace.activityFeed = appendActivityItem(
    nextWorkspace.activityFeed,
    dorm.id,
    "maintenance",
    `Maintenance updated — Room ${ticket.roomNumber}`,
    session!.name,
    status,
  );
  const ticketTenant = findTicketTenant(workspace, ticket);
  nextWorkspace.notifications = prependDormNotifications(
    nextWorkspace,
    dorm.id,
    [
      createNotification({
        dormId: dorm.id,
        type: "maintenance",
        eventType: "maintenance-ticket-status-changed",
        message: `Maintenance status changed for Room ${ticket.roomNumber}`,
        actor: session!.name,
        meta: status,
        tenantIds: ticketTenant ? [ticketTenant.id] : [],
        chefVisible: false,
      }),
    ],
  );

  return syncWorkspaceState(nextWorkspace);
}

export function setTenantMealPreferenceRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  tenantId: string,
  updates: Omit<TenantMealPreference, "tenantId">,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Tenant",
  ]);
  requireModuleEnabled(workspace, dorm.id, "mealService");

  if (session!.role === "Tenant" && session!.tenantId !== tenantId) {
    throw new DomainError(
      "FORBIDDEN",
      "Tenants can only manage their own meal preference.",
    );
  }

  const tenant = workspace.tenants.find(
    (candidate) => candidate.id === tenantId && candidate.dormId === dorm.id,
  );
  if (!tenant) {
    throw new DomainError(
      "TENANT_NOT_FOUND",
      "Resident record was not found in the active dorm.",
    );
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  const existingIndex = nextWorkspace.tenantMealPreferences.findIndex(
    (preference) => preference.tenantId === tenantId,
  );
  const nextPreference: TenantMealPreference = {
    tenantId,
    plan: updates.plan,
    notes: updates.notes,
  };

  if (existingIndex >= 0) {
    nextWorkspace.tenantMealPreferences[existingIndex] = nextPreference;
  } else {
    nextWorkspace.tenantMealPreferences.unshift(nextPreference);
  }

  return syncWorkspaceState(nextWorkspace);
}

export function addMealRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  input: AddMealInput,
): WorkspaceMutationResult<MealItemRecord> {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Chef",
  ]);
  requireModuleEnabled(workspace, dorm.id, "mealService");

  const nextMeal: MealItemRecord = {
    id: createRecordId("meal"),
    dormId: dorm.id,
    name: input.name.trim(),
    category: input.category,
    day: input.day.trim(),
    servings: input.servings,
    dietary: [],
    status: "Planned",
    calories: input.calories,
  };

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.mealItems.push(nextMeal);
  return { workspace: syncWorkspaceState(nextWorkspace), value: nextMeal };
}

export function updateMealStatusRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  mealId: string,
  status: MealItemRecord["status"],
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Chef",
  ]);
  requireModuleEnabled(workspace, dorm.id, "mealService");
  const meal = workspace.mealItems.find(
    (candidate) => candidate.id === mealId && candidate.dormId === dorm.id,
  );
  if (!meal) {
    throw new DomainError(
      "MEAL_NOT_FOUND",
      "Meal record was not found in the active dorm.",
    );
  }

  if (meal.status === status) {
    return workspace;
  }

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.mealItems = nextWorkspace.mealItems.map((meal) =>
    meal.id === mealId && meal.dormId === dorm.id ? { ...meal, status } : meal,
  );
  nextWorkspace.notifications = prependDormNotifications(
    nextWorkspace,
    dorm.id,
    [
      createNotification({
        dormId: dorm.id,
        type: "meal",
        eventType: "chef-meal-status-updated",
        message: `${meal.name} status updated`,
        actor: session!.name,
        meta: `${meal.day} · ${meal.category} · ${status}`,
        tenantIds: [],
        chefVisible: true,
      }),
    ],
  );
  return syncWorkspaceState(nextWorkspace);
}

export function markNotificationReadRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  notificationId: string,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Tenant",
    "Chef",
  ]);
  const viewer = resolveNotificationViewer(session!);
  let changed = false;
  const nextWorkspace = cloneWorkspaceState(workspace);

  nextWorkspace.notifications = nextWorkspace.notifications.map(
    (notification) => {
      if (
        notification.id !== notificationId ||
        notification.dormId !== dorm.id
      ) {
        return notification;
      }

      if (
        !isNotificationVisibleToViewer(notification, viewer) ||
        notification.readByUserIds.includes(viewer.userId)
      ) {
        return notification;
      }

      changed = true;
      return {
        ...notification,
        readByUserIds: [...notification.readByUserIds, viewer.userId],
      };
    },
  );

  return changed ? syncWorkspaceState(nextWorkspace) : workspace;
}

export function markAllNotificationsReadRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Tenant",
    "Chef",
  ]);
  const viewer = resolveNotificationViewer(session!);
  let changed = false;
  const nextWorkspace = cloneWorkspaceState(workspace);

  nextWorkspace.notifications = nextWorkspace.notifications.map(
    (notification) => {
      if (notification.dormId !== dorm.id) {
        return notification;
      }

      if (
        !isNotificationVisibleToViewer(notification, viewer) ||
        notification.readByUserIds.includes(viewer.userId)
      ) {
        return notification;
      }

      changed = true;
      return {
        ...notification,
        readByUserIds: [...notification.readByUserIds, viewer.userId],
      };
    },
  );

  return changed ? syncWorkspaceState(nextWorkspace) : workspace;
}

export function deleteMealRecord(
  workspace: DemoWorkspaceState,
  session: DemoSession | null,
  mealId: string,
): DemoWorkspaceState {
  const { dorm } = requireActiveDormAccess(workspace, session, [
    "Admin",
    "Chef",
  ]);
  requireModuleEnabled(workspace, dorm.id, "mealService");

  const nextWorkspace = cloneWorkspaceState(workspace);
  nextWorkspace.mealItems = nextWorkspace.mealItems.filter(
    (meal) => !(meal.id === mealId && meal.dormId === dorm.id),
  );
  return syncWorkspaceState(nextWorkspace);
}
