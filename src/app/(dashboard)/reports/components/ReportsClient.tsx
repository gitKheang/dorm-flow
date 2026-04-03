"use client";
import React, { useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  BedDouble,
  DollarSign,
  Wrench,
  UtensilsCrossed,
} from "lucide-react";
import FeatureGateNotice from "@/components/premium/FeatureGateNotice";
import PlanBadge from "@/components/premium/PlanBadge";
import { useDemoWorkspace } from "@/components/DemoWorkspaceProvider";
import { buildDormAnalyticsSnapshot } from "@/lib/domain/workspaceAnalytics";
import { buildPremiumCheckoutHref } from "@/lib/plans";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ROOM_TYPE_COLORS = [
  "hsl(var(--primary))",
  "#60a5fa",
  "#34d399",
  "#f59e0b",
];

export default function ReportsClient() {
  const {
    currentDormPlan,
    currentDorm,
    currentDormInvoices,
    currentDormMaintenanceTickets,
    currentDormMeals,
    currentDormPayments,
    currentDormRooms,
    currentDormTenants,
    getPremiumFeatureAccess,
    hasModule,
    workspace,
  } = useDemoWorkspace();
  const reportsAccess = currentDorm
    ? getPremiumFeatureAccess("reports", currentDorm.id)
    : null;
  const currentDormMealPreferences = useMemo(() => {
    const tenantIds = new Set(currentDormTenants.map((tenant) => tenant.id));
    return workspace.tenantMealPreferences.filter((preference) =>
      tenantIds.has(preference.tenantId),
    );
  }, [currentDormTenants, workspace.tenantMealPreferences]);
  const analytics = useMemo(
    () =>
      buildDormAnalyticsSnapshot({
        rooms: currentDormRooms,
        tenants: currentDormTenants,
        invoices: currentDormInvoices,
        payments: currentDormPayments,
        maintenanceTickets: currentDormMaintenanceTickets,
        mealItems: currentDormMeals,
        mealPreferences: currentDormMealPreferences,
        mealServiceEnabled: hasModule("mealService"),
      }),
    [
      currentDormInvoices,
      currentDormMaintenanceTickets,
      currentDormMealPreferences,
      currentDormMeals,
      currentDormPayments,
      currentDormRooms,
      currentDormTenants,
      hasModule,
    ],
  );

  if (currentDorm && reportsAccess && !reportsAccess.allowed) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Reports
            </h1>
            <PlanBadge plan={currentDormPlan} />
          </div>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {currentDorm.name} — reports are available when this dorm has
            Premium and Reports turned on.
          </p>
        </div>
        <FeatureGateNotice
          eyebrow={
            reportsAccess.reason === "plan"
              ? "Premium feature"
              : "Module paused"
          }
          title={
            reportsAccess.reason === "plan"
              ? "Reports require Premium for this dorm"
              : "Reports are turned off for this dorm"
          }
          description={
            reportsAccess.reason === "plan"
              ? "Upgrade this dorm to open reports for occupancy, payments, maintenance, and meal service."
              : "Turn Reports back on in settings to review this dorm again."
          }
          ctaLabel={
            reportsAccess.reason === "plan"
              ? "Upgrade to Premium"
              : "Open dorm settings"
          }
          ctaHref={
            reportsAccess.reason === "plan"
              ? buildPremiumCheckoutHref({
                  source: "reports",
                  returnTo: "/reports",
                })
              : "/settings?tab=dorm"
          }
          secondaryLabel="Back to dashboard"
          secondaryHref="/admin-dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
          Reports
        </h1>
        <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
          {currentDorm?.name ?? "Active Dorm"} — {analytics.labels.monthYear}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Occupancy",
            value: `${analytics.occupancy.occupancyRate}%`,
            sub: `${analytics.occupancy.occupiedRooms}/${analytics.occupancy.totalRooms} rooms`,
            icon: BedDouble,
            color: "text-[hsl(var(--primary))]",
            bg: "bg-[hsl(var(--primary)/0.08)]",
          },
          {
            label: "Collection Rate",
            value: `${analytics.payments.collectionRate}%`,
            sub: `${analytics.payments.successfulPaymentCount} confirmed payments`,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: `Revenue (${analytics.payments.currentMonthLabel})`,
            value: `$${analytics.payments.netCollectedAmount.toLocaleString()}`,
            sub: "Confirmed payments",
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Active Residents",
            value: String(analytics.occupancy.activeTenantCount),
            sub: "Residents with active accounts",
            icon: BarChart3,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-[hsl(var(--border))] p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
            >
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">
              {card.value}
            </p>
            <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))] mt-0.5">
              {card.label}
            </p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-[hsl(var(--border))] p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
                Occupancy Trend
              </h2>
              <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
                Occupied and available rooms for the selected period
              </p>
            </div>
            <span className="text-[12px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg px-3 py-1.5">
              {analytics.occupancy.rangeLabel}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.occupancy.trendData}>
                <defs>
                  <linearGradient
                    id="reportsOccGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, Math.max(analytics.occupancy.totalRooms, 1)]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupied"
                  name="Occupied"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#reportsOccGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="available"
                  name="Available"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
          <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-5">
            Room Types
          </h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.roomTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analytics.roomTypes.map((_, index) => (
                    <Cell
                      key={`room-type-${index}`}
                      fill={ROOM_TYPE_COLORS[index % ROOM_TYPE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {analytics.roomTypes.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        ROOM_TYPE_COLORS[index % ROOM_TYPE_COLORS.length],
                    }}
                  />
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {item.name}
                  </span>
                </div>
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-5">
          Payment Activity (6 months)
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.payments.trendData}
              barSize={14}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  "",
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="paid"
                name="Paid"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="pending"
                name="Pending"
                fill="#93c5fd"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="failed"
                name="Failed"
                fill="#fca5a5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
                Maintenance Status
              </h2>
              <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
                Open and resolved requests by status
              </p>
            </div>
            <div className="bg-amber-50 text-amber-700 rounded-lg px-3 py-2 text-[12px] font-medium flex items-center gap-2">
              <Wrench size={14} />
              {analytics.maintenance.activeTickets} active
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-center">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.maintenance.statusBreakdown}
                    dataKey="value"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {analytics.maintenance.statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {analytics.maintenance.statusBreakdown.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-[13px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-semibold text-[hsl(var(--foreground))]">
                    {entry.value}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-[hsl(var(--border))] space-y-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                <p>
                  {analytics.maintenance.criticalTickets} critical tickets still
                  open
                </p>
                <p>
                  {analytics.maintenance.latestUpdatedDateLabel
                    ? `Last status change on ${analytics.maintenance.latestUpdatedDateLabel}`
                    : "No maintenance activity yet"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
                Meal Service Demand
              </h2>
              <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
                Meal selections and scheduled servings
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-[12px] font-medium flex items-center gap-2">
              <UtensilsCrossed size={14} />
              {analytics.meals.enabled
                ? `${analytics.meals.activeSubscribers} subscribed`
                : "Module disabled"}
            </div>
          </div>

          {!analytics.meals.enabled ? (
            <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-10 text-center">
              <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
                Turn on meal service to see meal reports.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-center">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.meals.planBreakdown}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={68}
                      paddingAngle={4}
                    >
                      {analytics.meals.planBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[hsl(var(--muted)/0.45)] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Daily Demand
                    </p>
                    <p className="mt-1 text-xl font-700 text-[hsl(var(--foreground))]">
                      {analytics.meals.projectedDailyMeals}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--muted)/0.45)] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Scheduled Servings
                    </p>
                    <p className="mt-1 text-xl font-700 text-[hsl(var(--foreground))]">
                      {analytics.meals.scheduledServings}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {analytics.meals.statusBreakdown.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {entry.name}
                        </span>
                      </div>
                      <span className="font-semibold text-[hsl(var(--foreground))]">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-[hsl(var(--border))] text-[12px] text-[hsl(var(--muted-foreground))]">
                  Coverage is {analytics.meals.coverageRate}% of estimated daily
                  demand.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
