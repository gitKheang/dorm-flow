import type {
  MealItemRecord,
  MaintenanceStatusHistoryEntry,
  TenantMealPreference,
  WorkspaceInvoiceRecord,
  WorkspaceMaintenanceRecord,
  WorkspacePaymentRecord,
  WorkspaceRoomRecord,
  WorkspaceTenantRecord,
} from "@/lib/demoWorkspace";
import {
  buildPaymentSummary,
  buildPaymentTrendData,
  type PaymentSummary,
  type PaymentTrendPoint,
} from "@/lib/domain/paymentAnalytics";

export interface OccupancyTrendPoint {
  date: string;
  occupied: number;
  available: number;
}

export interface RoomTypeBreakdownItem {
  name: WorkspaceRoomRecord["type"];
  value: number;
}

export interface MaintenanceBreakdownItem {
  name: WorkspaceMaintenanceRecord["status"];
  value: number;
  fill: string;
}

export interface MealBreakdownItem {
  name: string;
  value: number;
  fill: string;
}

export interface OccupancyAnalytics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  underMaintenanceRooms: number;
  reservedRooms: number;
  activeTenantCount: number;
  occupancyRate: number;
  trendData: OccupancyTrendPoint[];
  rangeLabel: string;
  changeFromRangeStart: number;
}

export interface MaintenanceAnalytics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  activeTickets: number;
  statusBreakdown: MaintenanceBreakdownItem[];
  latestUpdatedDateLabel: string | null;
}

export interface MealDemandAnalytics {
  enabled: boolean;
  activeSubscribers: number;
  projectedDailyMeals: number;
  scheduledServings: number;
  coverageRate: number;
  servedMeals: number;
  inPrepMeals: number;
  plannedMeals: number;
  planBreakdown: MealBreakdownItem[];
  statusBreakdown: MealBreakdownItem[];
}

export interface DormAnalyticsSnapshot {
  labels: {
    longDate: string;
    monthYear: string;
  };
  occupancy: OccupancyAnalytics;
  payments: PaymentSummary & {
    trendData: PaymentTrendPoint[];
    currentMonthLabel: string;
    previousMonthLabel: string | null;
    paidMonthOverMonthChange: number;
  };
  maintenance: MaintenanceAnalytics;
  meals: MealDemandAnalytics;
  roomTypes: RoomTypeBreakdownItem[];
}

const MAINTENANCE_STATUS_COLORS: Record<
  WorkspaceMaintenanceRecord["status"],
  string
> = {
  Open: "#ef4444",
  "In Progress": "#3b82f6",
  Resolved: "#22c55e",
};

const MEAL_PLAN_COLORS: Record<string, string> = {
  "No Meal Plan": "#cbd5e1",
  "Breakfast Only": "#60a5fa",
  "Half Board": "#34d399",
  "Full Board": "hsl(var(--primary))",
};

const MEAL_STATUS_COLORS: Record<MealItemRecord["status"], string> = {
  Planned: "#60a5fa",
  "In Prep": "#f59e0b",
  Served: "#22c55e",
};

const MEAL_PLAN_DAILY_DEMAND: Record<string, number> = {
  "No Meal Plan": 0,
  "Breakfast Only": 1,
  "Half Board": 2,
  "Full Board": 3,
};

function parseDateValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(
    value.includes("T") ? value : `${value}T00:00:00.000Z`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDayLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatLongDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthYear(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatShortDate(value: string | undefined) {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toLocaleDateString("en-US") : null;
}

function getRangeLabel(points: OccupancyTrendPoint[]) {
  if (points.length === 0) {
    return "Last 30 days";
  }

  return `${points[0].date} - ${points[points.length - 1].date}`;
}

function resolveAnchorDate(params: {
  rooms: WorkspaceRoomRecord[];
  tenants: WorkspaceTenantRecord[];
  invoices: WorkspaceInvoiceRecord[];
  payments: WorkspacePaymentRecord[];
  maintenanceTickets: WorkspaceMaintenanceRecord[];
  maintenanceStatusHistory?: MaintenanceStatusHistoryEntry[];
  mealItems: MealItemRecord[];
}) {
  const timestamps = [
    ...params.rooms.map((room) => parseDateValue(room.lastUpdated)?.getTime() ?? 0),
    ...params.tenants.map(
      (tenant) => parseDateValue(tenant.moveInDate)?.getTime() ?? 0,
    ),
    ...params.invoices.map(
      (invoice) => parseDateValue(invoice.issuedDate)?.getTime() ?? 0,
    ),
    ...params.payments.map((payment) =>
      parseDateValue(payment.completedAt ?? payment.initiatedAt)?.getTime() ?? 0,
    ),
    ...params.maintenanceTickets.map(
      (ticket) => parseDateValue(ticket.updatedDate)?.getTime() ?? 0,
    ),
    ...(params.maintenanceStatusHistory ?? []).map(
      (entry) => parseDateValue(entry.changedAt)?.getTime() ?? 0,
    ),
    ...params.mealItems.map((meal) => parseDateValue(meal.day)?.getTime() ?? 0),
  ].filter((value) => value > 0);

  return timestamps.length > 0
    ? new Date(Math.max(...timestamps))
    : new Date();
}

function buildOccupancyTrendData(
  rooms: WorkspaceRoomRecord[],
  tenants: WorkspaceTenantRecord[],
  anchorDate: Date,
  points = 10,
  totalDays = 27,
): OccupancyTrendPoint[] {
  if (points < 2) {
    return [];
  }

  const startDate = new Date(anchorDate);
  startDate.setUTCDate(startDate.getUTCDate() - totalDays);

  return Array.from({ length: points }, (_, index) => {
    const pointDate = new Date(startDate);
    const offsetDays = Math.round((totalDays / (points - 1)) * index);
    pointDate.setUTCDate(startDate.getUTCDate() + offsetDays);

    const occupiedRoomIds = new Set(
      tenants
        .filter((tenant) => {
          const moveInDate = parseDateValue(tenant.moveInDate);
          return (
            tenant.status === "Active" &&
            tenant.roomId !== "unassigned" &&
            !!moveInDate &&
            moveInDate.getTime() <= pointDate.getTime()
          );
        })
        .map((tenant) => tenant.roomId),
    );

    const occupied = Math.min(occupiedRoomIds.size, rooms.length);
    return {
      date: formatDayLabel(pointDate),
      occupied,
      available: Math.max(rooms.length - occupied, 0),
    };
  });
}

function buildRoomTypeBreakdown(rooms: WorkspaceRoomRecord[]): RoomTypeBreakdownItem[] {
  return (["Single", "Double", "Triple", "Suite"] as const).map((type) => ({
    name: type,
    value: rooms.filter((room) => room.type === type).length,
  }));
}

function buildMaintenanceAnalytics(
  tickets: WorkspaceMaintenanceRecord[],
): MaintenanceAnalytics {
  const latestUpdatedAt = tickets.reduce<string | undefined>((latest, ticket) => {
    if (!latest) {
      return ticket.updatedDate;
    }

    const latestTime = parseDateValue(latest)?.getTime() ?? 0;
    const ticketTime = parseDateValue(ticket.updatedDate)?.getTime() ?? 0;
    return ticketTime > latestTime ? ticket.updatedDate : latest;
  }, undefined);

  return {
    totalTickets: tickets.length,
    openTickets: tickets.filter((ticket) => ticket.status === "Open").length,
    inProgressTickets: tickets.filter((ticket) => ticket.status === "In Progress")
      .length,
    resolvedTickets: tickets.filter((ticket) => ticket.status === "Resolved")
      .length,
    criticalTickets: tickets.filter(
      (ticket) => ticket.priority === "Critical" && ticket.status !== "Resolved",
    ).length,
    activeTickets: tickets.filter((ticket) => ticket.status !== "Resolved").length,
    statusBreakdown: (["Open", "In Progress", "Resolved"] as const).map(
      (status) => ({
        name: status,
        value: tickets.filter((ticket) => ticket.status === status).length,
        fill: MAINTENANCE_STATUS_COLORS[status],
      }),
    ),
    latestUpdatedDateLabel: formatShortDate(latestUpdatedAt),
  };
}

function buildMealDemandAnalytics(params: {
  enabled: boolean;
  tenants: WorkspaceTenantRecord[];
  preferences: TenantMealPreference[];
  mealItems: MealItemRecord[];
}): MealDemandAnalytics {
  if (!params.enabled) {
    return {
      enabled: false,
      activeSubscribers: 0,
      projectedDailyMeals: 0,
      scheduledServings: 0,
      coverageRate: 0,
      servedMeals: 0,
      inPrepMeals: 0,
      plannedMeals: 0,
      planBreakdown: [],
      statusBreakdown: [],
    };
  }

  const activeTenantIds = new Set(
    params.tenants
      .filter((tenant) => tenant.status === "Active")
      .map((tenant) => tenant.id),
  );
  const relevantPreferences = params.preferences.filter((preference) =>
    activeTenantIds.has(preference.tenantId),
  );
  const planBreakdown = (
    ["No Meal Plan", "Breakfast Only", "Half Board", "Full Board"] as const
  ).map((plan) => ({
    name: plan,
    value: relevantPreferences.filter((preference) => preference.plan === plan).length,
    fill: MEAL_PLAN_COLORS[plan],
  }));
  const activeSubscribers = planBreakdown
    .filter((entry) => entry.name !== "No Meal Plan")
    .reduce((sum, entry) => sum + entry.value, 0);
  const projectedDailyMeals = planBreakdown.reduce(
    (sum, entry) => sum + entry.value * MEAL_PLAN_DAILY_DEMAND[entry.name],
    0,
  );
  const scheduledServings = params.mealItems.reduce(
    (sum, meal) => sum + meal.servings,
    0,
  );

  return {
    enabled: true,
    activeSubscribers,
    projectedDailyMeals,
    scheduledServings,
    coverageRate:
      projectedDailyMeals > 0
        ? Math.round((scheduledServings / projectedDailyMeals) * 100)
        : 0,
    servedMeals: params.mealItems.filter((meal) => meal.status === "Served").length,
    inPrepMeals: params.mealItems.filter((meal) => meal.status === "In Prep").length,
    plannedMeals: params.mealItems.filter((meal) => meal.status === "Planned").length,
    planBreakdown,
    statusBreakdown: (["Planned", "In Prep", "Served"] as const).map(
      (status) => ({
        name: status,
        value: params.mealItems.filter((meal) => meal.status === status).length,
        fill: MEAL_STATUS_COLORS[status],
      }),
    ),
  };
}

function calculatePercentDelta(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

export function buildDormAnalyticsSnapshot(params: {
  rooms: WorkspaceRoomRecord[];
  tenants: WorkspaceTenantRecord[];
  invoices: WorkspaceInvoiceRecord[];
  payments: WorkspacePaymentRecord[];
  maintenanceTickets: WorkspaceMaintenanceRecord[];
  maintenanceStatusHistory?: MaintenanceStatusHistoryEntry[];
  mealItems: MealItemRecord[];
  mealPreferences: TenantMealPreference[];
  mealServiceEnabled: boolean;
}) : DormAnalyticsSnapshot {
  const anchorDate = resolveAnchorDate({
    rooms: params.rooms,
    tenants: params.tenants,
    invoices: params.invoices,
    payments: params.payments,
    maintenanceTickets: params.maintenanceTickets,
    maintenanceStatusHistory: params.maintenanceStatusHistory,
    mealItems: params.mealItems,
  });
  const occupancyTrend = buildOccupancyTrendData(
    params.rooms,
    params.tenants,
    anchorDate,
  );
  const paymentTrend = buildPaymentTrendData(params.payments, params.invoices, {
    referenceDate: anchorDate,
  });
  const currentPaymentMonth = paymentTrend[paymentTrend.length - 1];
  const previousPaymentMonth =
    paymentTrend.length > 1 ? paymentTrend[paymentTrend.length - 2] : null;
  const occupiedRooms = params.rooms.filter((room) => room.status === "Occupied")
    .length;
  const totalRooms = params.rooms.length;
  const activeTenantCount = params.tenants.filter(
    (tenant) => tenant.status === "Active",
  ).length;

  return {
    labels: {
      longDate: formatLongDate(anchorDate),
      monthYear: formatMonthYear(anchorDate),
    },
    occupancy: {
      totalRooms,
      occupiedRooms,
      availableRooms: params.rooms.filter((room) => room.status === "Available")
        .length,
      underMaintenanceRooms: params.rooms.filter(
        (room) => room.status === "Under Maintenance",
      ).length,
      reservedRooms: params.rooms.filter((room) => room.status === "Reserved").length,
      activeTenantCount,
      occupancyRate:
        totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      trendData: occupancyTrend,
      rangeLabel: getRangeLabel(occupancyTrend),
      changeFromRangeStart:
        totalRooms > 0 && occupancyTrend.length > 0
          ? Math.round(
              ((occupancyTrend[occupancyTrend.length - 1].occupied -
                occupancyTrend[0].occupied) /
                totalRooms) *
                100,
            )
          : 0,
    },
    payments: {
      ...buildPaymentSummary(params.invoices, params.payments),
      trendData: paymentTrend,
      currentMonthLabel: currentPaymentMonth?.month ?? formatMonthYear(anchorDate),
      previousMonthLabel: previousPaymentMonth?.month ?? null,
      paidMonthOverMonthChange: calculatePercentDelta(
        currentPaymentMonth?.paid ?? 0,
        previousPaymentMonth?.paid ?? 0,
      ),
    },
    maintenance: buildMaintenanceAnalytics(params.maintenanceTickets),
    meals: buildMealDemandAnalytics({
      enabled: params.mealServiceEnabled,
      tenants: params.tenants,
      preferences: params.mealPreferences,
      mealItems: params.mealItems,
    }),
    roomTypes: buildRoomTypeBreakdown(params.rooms),
  };
}
