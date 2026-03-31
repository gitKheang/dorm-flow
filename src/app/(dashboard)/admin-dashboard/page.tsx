'use client';

import React from 'react';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import DashboardKPIs from './components/DashboardKPIs';
import OccupancyChart from './components/OccupancyChart';
import PaymentChart from './components/PaymentChart';
import ActivityFeed from './components/ActivityFeed';
import MaintenanceList from './components/MaintenanceList';

export default function AdminDashboardPage() {
  const {
    currentDorm,
    currentDormActivityFeed,
    currentDormInvoices,
    currentDormMaintenanceTickets,
    currentDormRooms,
  } = useDemoWorkspace();

  return (
    <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Dashboard</h1>
            <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {currentDorm?.name ?? 'Active Dorm'} — March 31, 2026
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))] bg-white border border-[hsl(var(--border))] rounded-lg px-3 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live data · Updated just now
            </span>
          </div>
        </div>

        {/* KPI Bento Grid */}
        <DashboardKPIs
          invoices={currentDormInvoices}
          maintenanceTickets={currentDormMaintenanceTickets}
          rooms={currentDormRooms}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <OccupancyChart />
          </div>
          <div className="xl:col-span-2">
            <PaymentChart />
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
