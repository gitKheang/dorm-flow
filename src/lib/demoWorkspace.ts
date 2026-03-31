import type { EnabledModule } from '@/lib/modules';
import type { ActivityItem, Invoice, MaintenanceTicket, Room, Tenant } from '@/lib/mockData';
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
  type WorkspaceMaintenanceTicket,
  type WorkspaceRoom,
  type WorkspaceTenant,
} from '@/lib/demoData';

export type ChefShift = 'Morning' | 'Evening' | 'Split';
export type ChefStatus = 'Active' | 'Invited' | 'Inactive';
export type MealPlan = 'No Meal Plan' | 'Breakfast Only' | 'Half Board' | 'Full Board';
export type DormStatus = 'Active' | 'Archived';
export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type MealStatus = 'Planned' | 'In Prep' | 'Served';

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

export interface DemoWorkspaceState {
  enabledModules: EnabledModule[];
  currentDormId: string;
  dorms: DemoDorm[];
  rooms: WorkspaceRoom[];
  tenants: WorkspaceTenant[];
  chefs: ChefMember[];
  invoices: WorkspaceInvoice[];
  maintenanceTickets: WorkspaceMaintenanceTicket[];
  activityFeed: WorkspaceActivityItem[];
  tenantMealPreferences: TenantMealPreference[];
  mealItems: MealItemRecord[];
}

export const DEMO_WORKSPACE_STORAGE_KEY = 'dormflow-demo-workspace-v2';

export const DEFAULT_WORKSPACE_STATE: DemoWorkspaceState = {
  enabledModules: ['core', 'mealService', 'notifications', 'analytics', 'multiDorm'],
  currentDormId: 'dorm-001',
  dorms: DEMO_DORMS,
  rooms: DEMO_ROOMS,
  tenants: DEMO_TENANTS,
  chefs: DEMO_CHEFS,
  invoices: DEMO_INVOICES,
  maintenanceTickets: DEMO_MAINTENANCE_TICKETS,
  activityFeed: DEMO_ACTIVITY_FEED,
  tenantMealPreferences: DEMO_TENANT_MEAL_PREFERENCES,
  mealItems: DEMO_MEALS,
};

function cloneDefaultWorkspace(): DemoWorkspaceState {
  return {
    enabledModules: [...DEFAULT_WORKSPACE_STATE.enabledModules],
    currentDormId: DEFAULT_WORKSPACE_STATE.currentDormId,
    dorms: DEFAULT_WORKSPACE_STATE.dorms.map((dorm) => ({ ...dorm })),
    rooms: DEFAULT_WORKSPACE_STATE.rooms.map((room) => ({ ...room, assignedTenants: [...room.assignedTenants], amenities: [...room.amenities] })),
    tenants: DEFAULT_WORKSPACE_STATE.tenants.map((tenant) => ({ ...tenant })),
    chefs: DEFAULT_WORKSPACE_STATE.chefs.map((chef) => ({ ...chef })),
    invoices: DEFAULT_WORKSPACE_STATE.invoices.map((invoice) => ({ ...invoice })),
    maintenanceTickets: DEFAULT_WORKSPACE_STATE.maintenanceTickets.map((ticket) => ({ ...ticket })),
    activityFeed: DEFAULT_WORKSPACE_STATE.activityFeed.map((item) => ({ ...item })),
    tenantMealPreferences: DEFAULT_WORKSPACE_STATE.tenantMealPreferences.map((preference) => ({ ...preference })),
    mealItems: DEFAULT_WORKSPACE_STATE.mealItems.map((meal) => ({ ...meal, dietary: [...meal.dietary] })),
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isEnabledModule(value: unknown): value is EnabledModule {
  return value === 'core' || value === 'mealService' || value === 'notifications' || value === 'analytics' || value === 'multiDorm';
}

function asEnabledModules(value: unknown): EnabledModule[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKSPACE_STATE.enabledModules];
  }

  const filtered = value.filter(isEnabledModule);
  return filtered.includes('core') ? filtered : ['core', ...filtered];
}

function isDorm(value: unknown): value is DemoDorm {
  if (!value || typeof value !== 'object') return false;
  const dorm = value as Partial<DemoDorm>;
  return (
    isString(dorm.id) &&
    isString(dorm.name) &&
    isString(dorm.city) &&
    isString(dorm.address) &&
    isString(dorm.timezone) &&
    typeof dorm.waitlist === 'number' &&
    (dorm.status === 'Active' || dorm.status === 'Archived') &&
    isString(dorm.openedOn)
  );
}

function isTenant(value: unknown): value is WorkspaceTenant {
  if (!value || typeof value !== 'object') return false;
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
    (tenant.status === 'Active' || tenant.status === 'Inactive')
  );
}

function isChef(value: unknown): value is ChefMember {
  if (!value || typeof value !== 'object') return false;
  const chef = value as Partial<ChefMember>;
  return (
    isString(chef.id) &&
    isString(chef.dormId) &&
    isString(chef.name) &&
    isString(chef.email) &&
    (chef.shift === 'Morning' || chef.shift === 'Evening' || chef.shift === 'Split') &&
    isString(chef.specialty) &&
    (chef.status === 'Active' || chef.status === 'Invited' || chef.status === 'Inactive')
  );
}

function isRoom(value: unknown): value is WorkspaceRoom {
  if (!value || typeof value !== 'object') return false;
  const room = value as Partial<WorkspaceRoom>;
  return (
    isString(room.id) &&
    isString(room.dormId) &&
    isString(room.roomNumber) &&
    (room.type === 'Single' || room.type === 'Double' || room.type === 'Triple' || room.type === 'Suite') &&
    typeof room.floor === 'number' &&
    typeof room.capacity === 'number' &&
    typeof room.occupants === 'number' &&
    typeof room.rentPerMonth === 'number' &&
    (room.status === 'Occupied' || room.status === 'Available' || room.status === 'Under Maintenance' || room.status === 'Reserved') &&
    Array.isArray(room.assignedTenants) &&
    room.assignedTenants.every(isString) &&
    isString(room.lastUpdated) &&
    Array.isArray(room.amenities) &&
    room.amenities.every(isString) &&
    isString(room.notes)
  );
}

function isInvoice(value: unknown): value is WorkspaceInvoice {
  if (!value || typeof value !== 'object') return false;
  const invoice = value as Partial<WorkspaceInvoice>;
  return (
    isString(invoice.id) &&
    isString(invoice.dormId) &&
    isString(invoice.tenantId) &&
    isString(invoice.tenantName) &&
    isString(invoice.roomNumber) &&
    typeof invoice.amount === 'number' &&
    isString(invoice.dueDate) &&
    isString(invoice.issuedDate) &&
    (invoice.status === 'Paid' || invoice.status === 'Issued' || invoice.status === 'Overdue' || invoice.status === 'Draft') &&
    isString(invoice.period)
  );
}

function isMaintenanceTicket(value: unknown): value is WorkspaceMaintenanceTicket {
  if (!value || typeof value !== 'object') return false;
  const ticket = value as Partial<WorkspaceMaintenanceTicket>;
  return (
    isString(ticket.id) &&
    isString(ticket.dormId) &&
    isString(ticket.title) &&
    isString(ticket.roomId) &&
    isString(ticket.roomNumber) &&
    isString(ticket.tenantName) &&
    (ticket.priority === 'Low' || ticket.priority === 'Medium' || ticket.priority === 'High' || ticket.priority === 'Critical') &&
    (ticket.status === 'Open' || ticket.status === 'In Progress' || ticket.status === 'Resolved') &&
    isString(ticket.submittedDate) &&
    isString(ticket.updatedDate) &&
    isString(ticket.description) &&
    isString(ticket.category)
  );
}

function isActivityItem(value: unknown): value is WorkspaceActivityItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<WorkspaceActivityItem>;
  return (
    isString(item.id) &&
    isString(item.dormId) &&
    (item.type === 'payment' || item.type === 'maintenance' || item.type === 'assignment' || item.type === 'invoice' || item.type === 'room') &&
    isString(item.message) &&
    isString(item.timestamp) &&
    isString(item.actor) &&
    (item.meta === undefined || isString(item.meta))
  );
}

function isMealPreference(value: unknown): value is TenantMealPreference {
  if (!value || typeof value !== 'object') return false;
  const preference = value as Partial<TenantMealPreference>;
  return (
    isString(preference.tenantId) &&
    isString(preference.notes) &&
    (
      preference.plan === 'No Meal Plan' ||
      preference.plan === 'Breakfast Only' ||
      preference.plan === 'Half Board' ||
      preference.plan === 'Full Board'
    )
  );
}

function isMealItem(value: unknown): value is MealItemRecord {
  if (!value || typeof value !== 'object') return false;
  const meal = value as Partial<MealItemRecord>;
  return (
    isString(meal.id) &&
    isString(meal.dormId) &&
    isString(meal.name) &&
    (meal.category === 'Breakfast' || meal.category === 'Lunch' || meal.category === 'Dinner' || meal.category === 'Snack') &&
    isString(meal.day) &&
    typeof meal.servings === 'number' &&
    Array.isArray(meal.dietary) &&
    meal.dietary.every(isString) &&
    (meal.status === 'Planned' || meal.status === 'In Prep' || meal.status === 'Served') &&
    typeof meal.calories === 'number'
  );
}

function filterOrDefault<T>(value: unknown, fallback: T[], predicate: (item: unknown) => item is T): T[] {
  const cloneFallback = () => fallback.map((item) => JSON.parse(JSON.stringify(item)) as T);
  if (!Array.isArray(value)) {
    return cloneFallback();
  }

  const filtered = value.filter(predicate);
  return filtered.length > 0 ? filtered : cloneFallback();
}

export function restoreDemoWorkspace(rawValue: string | null): DemoWorkspaceState {
  const fallback = cloneDefaultWorkspace();
  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<DemoWorkspaceState>;
    const dorms = filterOrDefault(parsed.dorms, fallback.dorms, isDorm);
    const currentDormId =
      typeof parsed.currentDormId === 'string' && dorms.some((dorm) => dorm.id === parsed.currentDormId && dorm.status === 'Active')
        ? parsed.currentDormId
        : dorms.find((dorm) => dorm.status === 'Active')?.id ?? fallback.currentDormId;

    return {
      enabledModules: asEnabledModules(parsed.enabledModules),
      currentDormId,
      dorms,
      rooms: filterOrDefault(parsed.rooms, fallback.rooms, isRoom),
      tenants: filterOrDefault(parsed.tenants, fallback.tenants, isTenant),
      chefs: filterOrDefault(parsed.chefs, fallback.chefs, isChef),
      invoices: filterOrDefault(parsed.invoices, fallback.invoices, isInvoice),
      maintenanceTickets: filterOrDefault(parsed.maintenanceTickets, fallback.maintenanceTickets, isMaintenanceTicket),
      activityFeed: filterOrDefault(parsed.activityFeed, fallback.activityFeed, isActivityItem),
      tenantMealPreferences: filterOrDefault(parsed.tenantMealPreferences, fallback.tenantMealPreferences, isMealPreference),
      mealItems: filterOrDefault(parsed.mealItems, fallback.mealItems, isMealItem),
    };
  } catch {
    return fallback;
  }
}

export function isModuleEnabled(enabledModules: EnabledModule[], module: EnabledModule): boolean {
  if (module === 'core') {
    return true;
  }

  return enabledModules.includes(module);
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
