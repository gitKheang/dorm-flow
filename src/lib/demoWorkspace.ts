import type { EnabledModule } from "@/lib/modules";
import type { MembershipRole } from "@/lib/auth/types";
import type {
  ActivityItem,
  Invoice,
  MaintenanceStatus,
  MaintenanceTicket,
  Room,
  Tenant,
} from "@/lib/mockData";
import {
  DEMO_ACTIVITY_FEED,
  DEMO_CHEFS,
  DEMO_DORMS,
  DEMO_INVOICES,
  DEMO_MAINTENANCE_TICKETS,
  DEMO_MEALS,
  DEMO_ROOMS,
  DEMO_TENANTS,
  DEMO_TENANT_MEAL_PREFERENCES,
  type WorkspaceActivityItem,
  type WorkspaceChef,
  type WorkspaceInvoice,
  type WorkspaceInvitationLifecycleState,
  type WorkspaceMaintenanceTicket,
  type WorkspaceRoom,
  type WorkspaceTenant,
} from "@/lib/demoData";

export type ChefShift = "Morning" | "Evening" | "Split";
export type ChefStatus = "Active" | "Invited" | "Inactive";
export type MealPlan =
  | "No Meal Plan"
  | "Breakfast Only"
  | "Half Board"
  | "Full Board";
export type DormStatus = "Active" | "Archived";
export type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type MealStatus = "Planned" | "In Prep" | "Served";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentSource = "tenant-portal" | "admin-confirmation" | "seed";
export type NotificationCategory =
  | "assignment"
  | "maintenance"
  | "invoice"
  | "meal";
export type NotificationEventType =
  | "tenant-invitation-created"
  | "chef-invitation-created"
  | "invitation-revoked"
  | "invitation-expired"
  | "invitation-accepted"
  | "room-assignment-changed"
  | "room-status-changed"
  | "tenant-status-changed"
  | "chef-status-changed"
  | "maintenance-ticket-created"
  | "maintenance-ticket-status-changed"
  | "invoice-generated"
  | "invoice-payment-submitted"
  | "invoice-payment-rejected"
  | "invoice-paid"
  | "chef-meal-status-updated"
  | "module-toggle-changed";

export interface DemoDorm {
  id: string;
  name: string;
  city: string;
  address: string;
  timezone: string;
  waitlist: number;
  status: DormStatus;
  openedOn: string;
}

export interface ChefMember extends WorkspaceChef {}
export interface TenantMealPreference {
  tenantId: string;
  plan: MealPlan;
  notes: string;
}

export interface MealItemRecord {
  id: string;
  dormId: string;
  name: string;
  category: MealCategory;
  day: string;
  servings: number;
  dietary: string[];
  status: MealStatus;
  calories: number;
}

export interface DormModuleSettings {
  dormId: string;
  enabledModules: EnabledModule[];
}

export interface MaintenanceStatusHistoryEntry {
  id: string;
  dormId: string;
  ticketId: string;
  fromStatus?: MaintenanceStatus;
  toStatus: MaintenanceStatus;
  changedAt: string;
  changedByUserId: string;
  changedByName: string;
  changedByRole: MembershipRole;
  note?: string;
}

export interface WorkspacePaymentRecord {
  id: string;
  dormId: string;
  invoiceId: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  invoicePeriod: string;
  amount: number;
  status: PaymentStatus;
  initiatedAt: string;
  completedAt?: string;
  source: PaymentSource;
  methodLabel: string;
  reference: string;
  recordedByUserId: string;
  recordedByName: string;
  note?: string;
  failureReason?: string;
}

export interface WorkspaceNotificationRecord {
  id: string;
  dormId: string;
  type: NotificationCategory;
  eventType: NotificationEventType;
  message: string;
  actor: string;
  meta?: string;
  timestamp: string;
  tenantIds: string[];
  chefVisible: boolean;
  readByUserIds: string[];
}

export interface NotificationViewer {
  role: MembershipRole;
  userId: string;
  activeDormId: string;
  tenantId?: string;
}

export type TenantOperationalState =
  | "Pending Invite"
  | "Awaiting Room Assignment"
  | "Active"
  | "Inactive";

export interface DemoWorkspaceState {
  enabledModules: EnabledModule[];
  currentDormId: string;
  dormModules: DormModuleSettings[];
  dorms: DemoDorm[];
  rooms: WorkspaceRoom[];
  tenants: WorkspaceTenant[];
  chefs: ChefMember[];
  invoices: WorkspaceInvoice[];
  payments: WorkspacePaymentRecord[];
  maintenanceTickets: WorkspaceMaintenanceTicket[];
  maintenanceStatusHistory: MaintenanceStatusHistoryEntry[];
  activityFeed: WorkspaceActivityItem[];
  notifications: WorkspaceNotificationRecord[];
  tenantMealPreferences: TenantMealPreference[];
  mealItems: MealItemRecord[];
}

export const DEMO_WORKSPACE_STORAGE_KEY = "dormflow-demo-workspace-v2";

export const DEFAULT_ENABLED_MODULES: EnabledModule[] = [
  "core",
  "mealService",
  "notifications",
  "analytics",
  "multiDorm",
];

function buildDefaultDormModules(dorms: DemoDorm[]): DormModuleSettings[] {
  return dorms.map((dorm) => ({
    dormId: dorm.id,
    enabledModules: [...DEFAULT_ENABLED_MODULES],
  }));
}

function buildDefaultMaintenanceHistory(
  tickets: WorkspaceMaintenanceTicket[],
): MaintenanceStatusHistoryEntry[] {
  return tickets.map((ticket) => ({
    id: `maint-history-seed-${ticket.id}`,
    dormId: ticket.dormId,
    ticketId: ticket.id,
    toStatus: ticket.status,
    changedAt: ticket.submittedDate,
    changedByUserId: "system-seed",
    changedByName: ticket.tenantName,
    changedByRole: "Tenant",
    note: "Seeded from demo data",
  }));
}

function findTenantIdByName(
  dormId: string,
  tenantName: string,
  tenants: WorkspaceTenant[],
): string | undefined {
  return tenants.find(
    (tenant) =>
      tenant.dormId === dormId &&
      tenant.name.toLowerCase() === tenantName.trim().toLowerCase(),
  )?.id;
}

function extractRoomNumber(message: string): string | undefined {
  const match = message.match(/Room\s+(\d+)/i);
  return match?.[1];
}

function toIsoDateTime(value: string, fallbackHour = 9): string {
  const normalized = value.includes("T")
    ? value
    : `${value}T${String(fallbackHour).padStart(2, "0")}:00:00.000Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function buildSeedPaymentReference(
  invoiceId: string,
  status: PaymentStatus,
  suffix: string,
) {
  const compactId = invoiceId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `PMT-${compactId}-${status.toUpperCase()}-${suffix}`;
}

function sortPayments(
  payments: WorkspacePaymentRecord[],
): WorkspacePaymentRecord[] {
  return [...payments].sort((left, right) => {
    const leftTime = new Date(left.completedAt ?? left.initiatedAt).getTime();
    const rightTime = new Date(
      right.completedAt ?? right.initiatedAt,
    ).getTime();
    return rightTime - leftTime;
  });
}

function findPaymentActivityTimestamp(
  invoice: WorkspaceInvoice,
  activityFeed: WorkspaceActivityItem[],
) {
  return activityFeed.find(
    (item) =>
      item.dormId === invoice.dormId &&
      item.type === "payment" &&
      item.actor === invoice.tenantName &&
      item.message.includes(`Room ${invoice.roomNumber}`),
  )?.timestamp;
}

function buildSeedPayments(
  invoices: WorkspaceInvoice[],
  activityFeed: WorkspaceActivityItem[],
): WorkspacePaymentRecord[] {
  const payments: WorkspacePaymentRecord[] = invoices
    .filter((invoice) => invoice.status === "Paid")
    .map((invoice, index) => {
      const activityTimestamp = findPaymentActivityTimestamp(invoice, activityFeed);
      const initiatedAt = activityTimestamp
        ? toIsoDateTime(activityTimestamp)
        : toIsoDateTime(invoice.issuedDate, 10);

      return {
        id: `payment-seed-paid-${index}-${invoice.id}`,
        dormId: invoice.dormId,
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        tenantName: invoice.tenantName,
        roomNumber: invoice.roomNumber,
        invoicePeriod: invoice.period,
        amount: invoice.amount,
        status: "paid",
        initiatedAt,
        completedAt: initiatedAt,
        source: "seed",
        methodLabel: "Card payment",
        reference: buildSeedPaymentReference(invoice.id, "paid", "01"),
        recordedByUserId: invoice.tenantId,
        recordedByName: invoice.tenantName,
        note: "Seeded from paid invoice history",
      };
    });

  const pendingInvoices = new Set<string>();
  const failedInvoices = new Set<string>();

  invoices.forEach((invoice) => {
    if (invoice.status === "Issued" && !pendingInvoices.has(invoice.dormId)) {
      pendingInvoices.add(invoice.dormId);
      payments.push({
        id: `payment-seed-pending-${invoice.id}`,
        dormId: invoice.dormId,
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        tenantName: invoice.tenantName,
        roomNumber: invoice.roomNumber,
        invoicePeriod: invoice.period,
        amount: invoice.amount,
        status: "pending",
        initiatedAt: toIsoDateTime(invoice.dueDate, 8),
        source: "seed",
        methodLabel: "Bank transfer",
        reference: buildSeedPaymentReference(invoice.id, "pending", "01"),
        recordedByUserId: invoice.tenantId,
        recordedByName: invoice.tenantName,
        note: "Settlement is still pending",
      });
    }

    if (invoice.status === "Overdue" && !failedInvoices.has(invoice.dormId)) {
      failedInvoices.add(invoice.dormId);
      payments.push({
        id: `payment-seed-failed-${invoice.id}`,
        dormId: invoice.dormId,
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        tenantName: invoice.tenantName,
        roomNumber: invoice.roomNumber,
        invoicePeriod: invoice.period,
        amount: invoice.amount,
        status: "failed",
        initiatedAt: toIsoDateTime(invoice.dueDate, 18),
        source: "seed",
        methodLabel: "Card payment",
        reference: buildSeedPaymentReference(invoice.id, "failed", "01"),
        recordedByUserId: invoice.tenantId,
        recordedByName: invoice.tenantName,
        failureReason: "Card authorization was declined",
        note: "Retry required",
      });
    }
  });

  return sortPayments(payments);
}

function buildSeedNotifications(
  activityFeed: WorkspaceActivityItem[],
  tenants: WorkspaceTenant[],
  maintenanceTickets: WorkspaceMaintenanceTicket[],
): WorkspaceNotificationRecord[] {
  return activityFeed
    .map((item, index) => {
      const roomNumber = extractRoomNumber(item.message);
      const relatedTicket = roomNumber
        ? maintenanceTickets.find(
            (ticket) =>
              ticket.dormId === item.dormId && ticket.roomNumber === roomNumber,
          )
        : undefined;

      let type: NotificationCategory = "assignment";
      let eventType: NotificationEventType = "room-assignment-changed";
      let tenantIds: string[] = [];

      if (item.type === "payment") {
        type = "invoice";
        eventType = "invoice-paid";
        const tenantId = findTenantIdByName(item.dormId, item.actor, tenants);
        tenantIds = tenantId ? [tenantId] : [];
      } else if (item.type === "maintenance") {
        type = "maintenance";
        eventType =
          item.message.toLowerCase().includes("new maintenance request") ||
          item.message.toLowerCase().includes("ticket opened")
            ? "maintenance-ticket-created"
            : "maintenance-ticket-status-changed";

        const tenantId =
          relatedTicket?.createdByTenantId ??
          (relatedTicket?.tenantName
            ? findTenantIdByName(item.dormId, relatedTicket.tenantName, tenants)
            : undefined) ??
          findTenantIdByName(item.dormId, item.actor, tenants);
        tenantIds = tenantId ? [tenantId] : [];
      } else if (item.type === "invoice") {
        type = "invoice";
        eventType = "invoice-generated";
      } else if (item.type === "assignment") {
        type = "assignment";
        eventType = "room-assignment-changed";
        const tenantId = item.meta
          ? findTenantIdByName(item.dormId, item.meta, tenants)
          : undefined;
        tenantIds = tenantId ? [tenantId] : [];
      }

      return {
        id: `notif-seed-${index}-${item.id}`,
        dormId: item.dormId,
        type,
        eventType,
        message: item.message,
        actor: item.actor,
        meta: item.meta,
        timestamp: item.timestamp,
        tenantIds,
        chefVisible: false,
        readByUserIds: [],
      };
    })
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() -
        new Date(left.timestamp).getTime(),
    );
}

export const DEFAULT_WORKSPACE_STATE: DemoWorkspaceState = {
  enabledModules: [...DEFAULT_ENABLED_MODULES],
  currentDormId: "dorm-001",
  dormModules: buildDefaultDormModules(DEMO_DORMS),
  dorms: DEMO_DORMS,
  rooms: DEMO_ROOMS,
  tenants: DEMO_TENANTS,
  chefs: DEMO_CHEFS,
  invoices: DEMO_INVOICES,
  payments: buildSeedPayments(DEMO_INVOICES, DEMO_ACTIVITY_FEED),
  maintenanceTickets: DEMO_MAINTENANCE_TICKETS,
  maintenanceStatusHistory: buildDefaultMaintenanceHistory(
    DEMO_MAINTENANCE_TICKETS,
  ),
  activityFeed: DEMO_ACTIVITY_FEED,
  notifications: buildSeedNotifications(
    DEMO_ACTIVITY_FEED,
    DEMO_TENANTS,
    DEMO_MAINTENANCE_TICKETS,
  ),
  tenantMealPreferences: DEMO_TENANT_MEAL_PREFERENCES,
  mealItems: DEMO_MEALS,
};

function cloneDefaultWorkspace(): DemoWorkspaceState {
  return {
    enabledModules: [...DEFAULT_WORKSPACE_STATE.enabledModules],
    currentDormId: DEFAULT_WORKSPACE_STATE.currentDormId,
    dormModules: DEFAULT_WORKSPACE_STATE.dormModules.map((item) => ({
      dormId: item.dormId,
      enabledModules: [...item.enabledModules],
    })),
    dorms: DEFAULT_WORKSPACE_STATE.dorms.map((dorm) => ({ ...dorm })),
    rooms: DEFAULT_WORKSPACE_STATE.rooms.map((room) => ({
      ...room,
      assignedTenants: [...room.assignedTenants],
      amenities: [...room.amenities],
    })),
    tenants: DEFAULT_WORKSPACE_STATE.tenants.map((tenant) => ({ ...tenant })),
    chefs: DEFAULT_WORKSPACE_STATE.chefs.map((chef) => ({ ...chef })),
    invoices: DEFAULT_WORKSPACE_STATE.invoices.map((invoice) => ({
      ...invoice,
    })),
    payments: DEFAULT_WORKSPACE_STATE.payments.map((payment) => ({
      ...payment,
    })),
    maintenanceTickets: DEFAULT_WORKSPACE_STATE.maintenanceTickets.map(
      (ticket) => ({ ...ticket }),
    ),
    maintenanceStatusHistory:
      DEFAULT_WORKSPACE_STATE.maintenanceStatusHistory.map((entry) => ({
        ...entry,
      })),
    activityFeed: DEFAULT_WORKSPACE_STATE.activityFeed.map((item) => ({
      ...item,
    })),
    notifications: DEFAULT_WORKSPACE_STATE.notifications.map(
      (notification) => ({
        ...notification,
        tenantIds: [...notification.tenantIds],
        readByUserIds: [...notification.readByUserIds],
      }),
    ),
    tenantMealPreferences: DEFAULT_WORKSPACE_STATE.tenantMealPreferences.map(
      (preference) => ({ ...preference }),
    ),
    mealItems: DEFAULT_WORKSPACE_STATE.mealItems.map((meal) => ({
      ...meal,
      dietary: [...meal.dietary],
    })),
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isEnabledModule(value: unknown): value is EnabledModule {
  return (
    value === "core" ||
    value === "mealService" ||
    value === "notifications" ||
    value === "analytics" ||
    value === "multiDorm"
  );
}

function asEnabledModules(value: unknown): EnabledModule[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_ENABLED_MODULES];
  }

  const filtered = value.filter(isEnabledModule);
  return filtered.includes("core") ? filtered : ["core", ...filtered];
}

function isDormModuleSettings(value: unknown): value is DormModuleSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<DormModuleSettings>;
  return (
    isString(settings.dormId) &&
    Array.isArray(settings.enabledModules) &&
    settings.enabledModules.every(isEnabledModule)
  );
}

function isDorm(value: unknown): value is DemoDorm {
  if (!value || typeof value !== "object") return false;
  const dorm = value as Partial<DemoDorm>;
  return (
    isString(dorm.id) &&
    isString(dorm.name) &&
    isString(dorm.city) &&
    isString(dorm.address) &&
    isString(dorm.timezone) &&
    typeof dorm.waitlist === "number" &&
    (dorm.status === "Active" || dorm.status === "Archived") &&
    isString(dorm.openedOn)
  );
}

function isTenant(value: unknown): value is WorkspaceTenant {
  if (!value || typeof value !== "object") return false;
  const tenant = value as Partial<WorkspaceTenant>;
  return (
    isString(tenant.id) &&
    isString(tenant.dormId) &&
    isString(tenant.name) &&
    isString(tenant.email) &&
    isString(tenant.phone) &&
    isString(tenant.avatar) &&
    isString(tenant.roomId) &&
    isString(tenant.moveInDate) &&
    (tenant.invitationLifecycleState === undefined ||
      isInvitationLifecycleState(tenant.invitationLifecycleState)) &&
    (tenant.status === "Active" || tenant.status === "Inactive")
  );
}

function isChef(value: unknown): value is ChefMember {
  if (!value || typeof value !== "object") return false;
  const chef = value as Partial<ChefMember>;
  return (
    isString(chef.id) &&
    isString(chef.dormId) &&
    isString(chef.name) &&
    isString(chef.email) &&
    (chef.shift === "Morning" ||
      chef.shift === "Evening" ||
      chef.shift === "Split") &&
    isString(chef.specialty) &&
    (chef.invitationLifecycleState === undefined ||
      isInvitationLifecycleState(chef.invitationLifecycleState)) &&
    (chef.status === "Active" ||
      chef.status === "Invited" ||
      chef.status === "Inactive")
  );
}

function isInvitationLifecycleState(
  value: unknown,
): value is WorkspaceInvitationLifecycleState {
  return value === "pending" || value === "revoked" || value === "expired";
}

function isRoom(value: unknown): value is WorkspaceRoom {
  if (!value || typeof value !== "object") return false;
  const room = value as Partial<WorkspaceRoom>;
  return (
    isString(room.id) &&
    isString(room.dormId) &&
    isString(room.roomNumber) &&
    (room.type === "Single" ||
      room.type === "Double" ||
      room.type === "Triple" ||
      room.type === "Suite") &&
    typeof room.floor === "number" &&
    typeof room.capacity === "number" &&
    typeof room.occupants === "number" &&
    typeof room.rentPerMonth === "number" &&
    (room.status === "Occupied" ||
      room.status === "Available" ||
      room.status === "Under Maintenance" ||
      room.status === "Reserved") &&
    Array.isArray(room.assignedTenants) &&
    room.assignedTenants.every(isString) &&
    isString(room.lastUpdated) &&
    Array.isArray(room.amenities) &&
    room.amenities.every(isString) &&
    isString(room.notes)
  );
}

function isInvoice(value: unknown): value is WorkspaceInvoice {
  if (!value || typeof value !== "object") return false;
  const invoice = value as Partial<WorkspaceInvoice>;
  return (
    isString(invoice.id) &&
    isString(invoice.dormId) &&
    isString(invoice.tenantId) &&
    isString(invoice.tenantName) &&
    isString(invoice.roomNumber) &&
    typeof invoice.amount === "number" &&
    isString(invoice.dueDate) &&
    isString(invoice.issuedDate) &&
    (invoice.status === "Paid" ||
      invoice.status === "Issued" ||
      invoice.status === "Overdue" ||
      invoice.status === "Draft") &&
    isString(invoice.period) &&
    (invoice.billingPeriodKey === undefined ||
      isString(invoice.billingPeriodKey))
  );
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "paid" ||
    value === "failed" ||
    value === "refunded"
  );
}

function isPaymentSource(value: unknown): value is PaymentSource {
  return (
    value === "tenant-portal" ||
    value === "admin-confirmation" ||
    value === "seed"
  );
}

function isPaymentRecord(value: unknown): value is WorkspacePaymentRecord {
  if (!value || typeof value !== "object") return false;
  const payment = value as Partial<WorkspacePaymentRecord>;
  return (
    isString(payment.id) &&
    isString(payment.dormId) &&
    isString(payment.invoiceId) &&
    isString(payment.tenantId) &&
    isString(payment.tenantName) &&
    isString(payment.roomNumber) &&
    isString(payment.invoicePeriod) &&
    typeof payment.amount === "number" &&
    isPaymentStatus(payment.status) &&
    isString(payment.initiatedAt) &&
    (payment.completedAt === undefined || isString(payment.completedAt)) &&
    isPaymentSource(payment.source) &&
    isString(payment.methodLabel) &&
    isString(payment.reference) &&
    isString(payment.recordedByUserId) &&
    isString(payment.recordedByName) &&
    (payment.note === undefined || isString(payment.note)) &&
    (payment.failureReason === undefined || isString(payment.failureReason))
  );
}

function isMaintenanceTicket(
  value: unknown,
): value is WorkspaceMaintenanceTicket {
  if (!value || typeof value !== "object") return false;
  const ticket = value as Partial<WorkspaceMaintenanceTicket>;
  return (
    isString(ticket.id) &&
    isString(ticket.dormId) &&
    isString(ticket.title) &&
    isString(ticket.roomId) &&
    isString(ticket.roomNumber) &&
    isString(ticket.tenantName) &&
    (ticket.createdByTenantId === undefined ||
      isString(ticket.createdByTenantId)) &&
    (ticket.createdByMembershipId === undefined ||
      isString(ticket.createdByMembershipId)) &&
    (ticket.priority === "Low" ||
      ticket.priority === "Medium" ||
      ticket.priority === "High" ||
      ticket.priority === "Critical") &&
    (ticket.status === "Open" ||
      ticket.status === "In Progress" ||
      ticket.status === "Resolved") &&
    isString(ticket.submittedDate) &&
    isString(ticket.updatedDate) &&
    isString(ticket.description) &&
    isString(ticket.category)
  );
}

function isMaintenanceStatusHistoryEntry(
  value: unknown,
): value is MaintenanceStatusHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<MaintenanceStatusHistoryEntry>;
  return (
    isString(entry.id) &&
    isString(entry.dormId) &&
    isString(entry.ticketId) &&
    (entry.fromStatus === undefined ||
      entry.fromStatus === "Open" ||
      entry.fromStatus === "In Progress" ||
      entry.fromStatus === "Resolved") &&
    (entry.toStatus === "Open" ||
      entry.toStatus === "In Progress" ||
      entry.toStatus === "Resolved") &&
    isString(entry.changedAt) &&
    isString(entry.changedByUserId) &&
    isString(entry.changedByName) &&
    (entry.changedByRole === "Admin" ||
      entry.changedByRole === "Tenant" ||
      entry.changedByRole === "Chef") &&
    (entry.note === undefined || isString(entry.note))
  );
}

function isActivityItem(value: unknown): value is WorkspaceActivityItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<WorkspaceActivityItem>;
  return (
    isString(item.id) &&
    isString(item.dormId) &&
    (item.type === "payment" ||
      item.type === "maintenance" ||
      item.type === "assignment" ||
      item.type === "invoice" ||
      item.type === "room") &&
    isString(item.message) &&
    isString(item.timestamp) &&
    isString(item.actor) &&
    (item.meta === undefined || isString(item.meta))
  );
}

function isNotification(value: unknown): value is WorkspaceNotificationRecord {
  if (!value || typeof value !== "object") return false;
  const notification = value as Partial<WorkspaceNotificationRecord>;
  return (
    isString(notification.id) &&
    isString(notification.dormId) &&
    (notification.type === "assignment" ||
      notification.type === "maintenance" ||
      notification.type === "invoice" ||
      notification.type === "meal") &&
    (notification.eventType === "tenant-invitation-created" ||
      notification.eventType === "chef-invitation-created" ||
      notification.eventType === "invitation-revoked" ||
      notification.eventType === "invitation-expired" ||
      notification.eventType === "invitation-accepted" ||
      notification.eventType === "room-assignment-changed" ||
      notification.eventType === "room-status-changed" ||
      notification.eventType === "tenant-status-changed" ||
      notification.eventType === "chef-status-changed" ||
      notification.eventType === "maintenance-ticket-created" ||
      notification.eventType === "maintenance-ticket-status-changed" ||
      notification.eventType === "invoice-generated" ||
      notification.eventType === "invoice-payment-submitted" ||
      notification.eventType === "invoice-payment-rejected" ||
      notification.eventType === "invoice-paid" ||
      notification.eventType === "chef-meal-status-updated" ||
      notification.eventType === "module-toggle-changed") &&
    isString(notification.message) &&
    isString(notification.actor) &&
    isString(notification.timestamp) &&
    (notification.meta === undefined || isString(notification.meta)) &&
    Array.isArray(notification.tenantIds) &&
    notification.tenantIds.every(isString) &&
    typeof notification.chefVisible === "boolean" &&
    Array.isArray(notification.readByUserIds) &&
    notification.readByUserIds.every(isString)
  );
}

function isMealPreference(value: unknown): value is TenantMealPreference {
  if (!value || typeof value !== "object") return false;
  const preference = value as Partial<TenantMealPreference>;
  return (
    isString(preference.tenantId) &&
    isString(preference.notes) &&
    (preference.plan === "No Meal Plan" ||
      preference.plan === "Breakfast Only" ||
      preference.plan === "Half Board" ||
      preference.plan === "Full Board")
  );
}

function isMealItem(value: unknown): value is MealItemRecord {
  if (!value || typeof value !== "object") return false;
  const meal = value as Partial<MealItemRecord>;
  return (
    isString(meal.id) &&
    isString(meal.dormId) &&
    isString(meal.name) &&
    (meal.category === "Breakfast" ||
      meal.category === "Lunch" ||
      meal.category === "Dinner" ||
      meal.category === "Snack") &&
    isString(meal.day) &&
    typeof meal.servings === "number" &&
    Array.isArray(meal.dietary) &&
    meal.dietary.every(isString) &&
    (meal.status === "Planned" ||
      meal.status === "In Prep" ||
      meal.status === "Served") &&
    typeof meal.calories === "number"
  );
}

function resolveDormModules(
  dorms: DemoDorm[],
  storedDormModules: DormModuleSettings[],
  fallbackModules: EnabledModule[],
): DormModuleSettings[] {
  return dorms.map((dorm) => ({
    dormId: dorm.id,
    enabledModules: asEnabledModules(
      storedDormModules.find((item) => item.dormId === dorm.id)
        ?.enabledModules ?? fallbackModules,
    ),
  }));
}

export function getDormEnabledModules(
  workspace: Pick<
    DemoWorkspaceState,
    "currentDormId" | "dormModules" | "enabledModules"
  >,
  dormId?: string,
): EnabledModule[] {
  const resolvedDormId = dormId ?? workspace.currentDormId;
  const configured = workspace.dormModules.find(
    (item) => item.dormId === resolvedDormId,
  )?.enabledModules;
  return asEnabledModules(configured ?? workspace.enabledModules);
}

export function getTenantOperationalState(
  tenant: Pick<
    WorkspaceTenantRecord,
    "status" | "roomId" | "invitationLifecycleState"
  >,
): TenantOperationalState {
  if (tenant.invitationLifecycleState === "pending") {
    return "Pending Invite";
  }

  if (tenant.status === "Active" && tenant.roomId === "unassigned") {
    return "Awaiting Room Assignment";
  }

  return tenant.status;
}

function filterOrDefault<T>(
  value: unknown,
  fallback: T[],
  predicate: (item: unknown) => item is T,
): T[] {
  const cloneFallback = () =>
    fallback.map((item) => JSON.parse(JSON.stringify(item)) as T);
  if (!Array.isArray(value)) {
    return cloneFallback();
  }

  const filtered = value.filter(predicate);
  return filtered.length > 0 ? filtered : cloneFallback();
}

function resolveNotifications(
  value: unknown,
  fallback: WorkspaceNotificationRecord[],
  activityFeed: WorkspaceActivityItem[],
  tenants: WorkspaceTenant[],
  maintenanceTickets: WorkspaceMaintenanceTicket[],
) {
  if (!Array.isArray(value)) {
    return buildSeedNotifications(activityFeed, tenants, maintenanceTickets);
  }

  const filtered = value.filter(isNotification);
  if (filtered.length > 0 || value.length === 0) {
    return filtered;
  }

  // Older local snapshots can contain pre-upgrade notification records that no
  // longer satisfy the current validator. When every stored item is rejected,
  // rebuild from the stable demo seed instead of reviving an empty inbox.
  return fallback.length > 0
    ? buildSeedNotifications(activityFeed, tenants, maintenanceTickets)
    : [];
}

function resolvePayments(
  value: unknown,
  invoices: WorkspaceInvoice[],
  activityFeed: WorkspaceActivityItem[],
) {
  // Older demo snapshots predate the payment ledger. When that field is
  // missing, derive a stable ledger from invoice state so existing local
  // sessions upgrade cleanly without falling back to mock page data.
  if (!Array.isArray(value)) {
    return buildSeedPayments(invoices, activityFeed);
  }

  const filtered = value.filter(isPaymentRecord);
  if (filtered.length > 0 || value.length === 0) {
    return sortPayments(filtered);
  }

  // Some legacy snapshots may still contain payment-like objects from an older
  // schema revision. If none of them are valid anymore, regenerate the seed
  // ledger so invoices, dashboards, and reports stay consistent in demo mode.
  return buildSeedPayments(invoices, activityFeed);
}

export function restoreDemoWorkspace(
  rawValue: string | null,
): DemoWorkspaceState {
  const fallback = cloneDefaultWorkspace();
  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<DemoWorkspaceState>;
    const dorms = filterOrDefault(parsed.dorms, fallback.dorms, isDorm);
    const fallbackModules = asEnabledModules(parsed.enabledModules);
    const dormModules = resolveDormModules(
      dorms,
      filterOrDefault(
        parsed.dormModules,
        fallback.dormModules,
        isDormModuleSettings,
      ),
      fallbackModules,
    );
    const tenants = filterOrDefault(parsed.tenants, fallback.tenants, isTenant);
    const invoices = filterOrDefault(
      parsed.invoices,
      fallback.invoices,
      isInvoice,
    );
    const maintenanceTickets = filterOrDefault(
      parsed.maintenanceTickets,
      fallback.maintenanceTickets,
      isMaintenanceTicket,
    );
    const activityFeed = filterOrDefault(
      parsed.activityFeed,
      fallback.activityFeed,
      isActivityItem,
    );
    const currentDormId =
      typeof parsed.currentDormId === "string" &&
      dorms.some(
        (dorm) => dorm.id === parsed.currentDormId && dorm.status === "Active",
      )
        ? parsed.currentDormId
        : (dorms.find((dorm) => dorm.status === "Active")?.id ??
          fallback.currentDormId);

    return {
      enabledModules: getDormEnabledModules(
        { currentDormId, dormModules, enabledModules: fallbackModules },
        currentDormId,
      ),
      currentDormId,
      dormModules,
      dorms,
      rooms: filterOrDefault(parsed.rooms, fallback.rooms, isRoom),
      tenants,
      chefs: filterOrDefault(parsed.chefs, fallback.chefs, isChef),
      invoices,
      payments: resolvePayments(parsed.payments, invoices, activityFeed),
      maintenanceTickets,
      maintenanceStatusHistory: filterOrDefault(
        parsed.maintenanceStatusHistory,
        fallback.maintenanceStatusHistory,
        isMaintenanceStatusHistoryEntry,
      ),
      activityFeed,
      notifications: resolveNotifications(
        parsed.notifications,
        fallback.notifications,
        activityFeed,
        tenants,
        maintenanceTickets,
      ),
      tenantMealPreferences: filterOrDefault(
        parsed.tenantMealPreferences,
        fallback.tenantMealPreferences,
        isMealPreference,
      ),
      mealItems: filterOrDefault(
        parsed.mealItems,
        fallback.mealItems,
        isMealItem,
      ),
    };
  } catch {
    return fallback;
  }
}

export function isModuleEnabled(
  enabledModules: EnabledModule[],
  module: EnabledModule,
): boolean {
  if (module === "core") {
    return true;
  }

  return enabledModules.includes(module);
}

export function isNotificationVisibleToViewer(
  notification: WorkspaceNotificationRecord,
  viewer: NotificationViewer,
): boolean {
  if (notification.dormId !== viewer.activeDormId) {
    return false;
  }

  if (viewer.role === "Admin") {
    return true;
  }

  if (viewer.role === "Chef") {
    return notification.chefVisible;
  }

  return viewer.tenantId
    ? notification.tenantIds.includes(viewer.tenantId)
    : false;
}

export type WorkspaceRoomRecord = WorkspaceRoom;
export type WorkspaceTenantRecord = WorkspaceTenant;
export type WorkspaceInvoiceRecord = WorkspaceInvoice;
export type WorkspaceMaintenanceRecord = WorkspaceMaintenanceTicket;
export type WorkspaceActivityRecord = WorkspaceActivityItem;
export type WorkspaceBaseRoom = Room;
export type WorkspaceBaseTenant = Tenant;
export type WorkspaceBaseInvoice = Invoice;
export type WorkspaceBaseMaintenance = MaintenanceTicket;
export type WorkspaceBaseActivity = ActivityItem;
