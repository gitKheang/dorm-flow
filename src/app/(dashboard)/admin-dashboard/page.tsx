'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import PlanBadge from '@/components/premium/PlanBadge';
import { buildDormAnalyticsSnapshot } from '@/lib/domain/workspaceAnalytics';
import DashboardKPIs from './components/DashboardKPIs';
import OccupancyChart from './components/OccupancyChart';
import PaymentChart from './components/PaymentChart';
import ActivityFeed from './components/ActivityFeed';
import MaintenanceList from './components/MaintenanceList';

export default function AdminDashboardPage() {
  const {
    currentDorm,
    currentDormPlan,
    currentDormActivityFeed,
    currentDormInvoices,
    currentDormMaintenanceTickets,
    currentDormMeals,
    currentDormPayments,
    currentDormRooms,
    currentDormTenants,
    hasModule,
    workspace,
  } = useDemoWorkspace();
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
        mealServiceEnabled: hasModule('mealService'),
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

  return (
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Dashboard</h1>
              <PlanBadge plan={currentDormPlan} />
            </div>
            <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {currentDorm?.name ?? 'Active Dorm'} — {analytics.labels.longDate}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))] bg-white border border-[hsl(var(--border))] rounded-lg px-3 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live data · Updated just now
            </span>
          </div>
        </div>

        {currentDormPlan === 'free' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[13px] font-semibold text-amber-900">Free plan active for this dorm</p>
                <p className="mt-1 text-[12px] text-amber-800">
                  Core dorm operations stay free. Upgrade this dorm when you need chef workflows, meal service, reports, or multi-dorm portfolio management.
                </p>
              </div>
              <Link
                href="/settings?tab=dorm"
                className="inline-flex rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
              >
                Manage plan
              </Link>
            </div>
          </div>
        )}

        {/* KPI Bento Grid */}
        <DashboardKPIs analytics={analytics} />

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <OccupancyChart
              data={analytics.occupancy.trendData}
              rangeLabel={analytics.occupancy.rangeLabel}
              totalRooms={analytics.occupancy.totalRooms}
            />
          </div>
          <div className="xl:col-span-2">
            <PaymentChart data={analytics.payments.trendData} />
          </div>
        </div>

        {/* Bottom row: activity + maintenance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActivityFeed items={currentDormActivityFeed} />
          <MaintenanceList tickets={currentDormMaintenanceTickets} />
        </div>
    </div>
  );
}
