'use client';
import React from 'react';
import Link from 'next/link';
import { BedDouble, TrendingUp, AlertTriangle, Wrench, DoorOpen, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { DormAnalyticsSnapshot } from '@/lib/domain/workspaceAnalytics';

export default function DashboardKPIs({
  analytics,
}: {
  analytics: DormAnalyticsSnapshot;
}) {
  const OccupancyDirectionIcon =
    analytics.occupancy.changeFromRangeStart >= 0 ? ArrowUpRight : ArrowDownRight;
  const CollectionDirectionIcon =
    analytics.payments.paidMonthOverMonthChange >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    // 6 cards: hero(col-span-2) + 5 regular → grid-cols-4 → row1: hero(2)+2regular, row2: 3regular (last spans 1 each, last one spans 2 to avoid orphan? Actually 3 on row2 fits 3cols... use grid-cols-3 for row2 via subgrid or just use a single flat grid-cols-4 with careful spans)
    // Plan: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4
    // Card 1 (hero occupancy): lg:col-span-2
    // Cards 2-6: each col-span-1 → row1: hero(2)+card2+card3 = 4cols ✓, row2: card4+card5+card6+empty → fix: make card6 span 2? No, use grid-cols-3 for last row
    // Simplest: grid-cols-4, hero spans 2, cards 2-6 span 1 each → 2+1+1=4 row1, then 1+1+1+1=4 row2 (4 cards on row 2 but we only have 4 remaining: cards 2,3,4,5 on row1 after hero? No.
    // Final plan: grid-cols-4, hero col-span-2 row1, then 4 remaining cards col-span-1 each on rows 1-2, last card col-span-2 to fill
    // Simplest correct: 6 cards, grid-cols-3, hero spans full row (col-span-3), then 3+2? No.
    // CORRECT: grid-cols-4. Row1: hero(col-span-2) + card2(col-span-1) + card3(col-span-1). Row2: card4 + card5 + card6(col-span-2). Total: 4+4=8 col-units ✓
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* Hero: Occupancy Rate — col-span-2 */}
      <div className="lg:col-span-2 bg-[hsl(var(--primary))] text-white rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wider text-white/70">Occupancy Rate</p>
            <p className="text-5xl font-700 tabular-nums mt-1">{analytics.occupancy.occupancyRate}%</p>
            <p className="text-[13px] text-white/70 mt-1">{analytics.occupancy.occupiedRooms} of {analytics.occupancy.totalRooms} rooms occupied</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <BedDouble size={24} />
          </div>
        </div>
        <div className="relative">
          <div className="flex justify-between text-[12px] text-white/70 mb-1.5">
            <span>Occupancy</span>
            <span>{analytics.occupancy.occupancyRate}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${analytics.occupancy.occupancyRate}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <OccupancyDirectionIcon size={14} />
            <span className="text-[12px] text-white/80">
              {analytics.occupancy.changeFromRangeStart >= 0 ? '+' : ''}
              {analytics.occupancy.changeFromRangeStart}% vs range start
            </span>
          </div>
        </div>
      </div>
      {/* Card 2: Rent Collection Rate */}
      <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="bg-green-50 p-2.5 rounded-lg">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <span className="flex items-center gap-1 text-[12px] text-green-600 font-medium">
            <CollectionDirectionIcon size={12} />
            {analytics.payments.paidMonthOverMonthChange >= 0 ? '+' : ''}
            {analytics.payments.paidMonthOverMonthChange}%
          </span>
        </div>
        <div>
          <p className="text-[12px] font-500 uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Collection Rate</p>
          <p className="text-3xl font-700 tabular-nums text-[hsl(var(--foreground))] mt-0.5">{analytics.payments.collectionRate}%</p>
        </div>
          <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{analytics.payments.successfulPaymentCount} confirmed payments on record</p>
      </div>
      {/* Card 3: Overdue Invoices — ALERT */}
      <div className="bg-red-50 rounded-xl p-5 border border-red-200 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="bg-red-100 p-2.5 rounded-lg">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <span className="flex items-center gap-1 text-[12px] text-red-600 font-medium">
            <ArrowDownRight size={12} />
            Action needed
          </span>
        </div>
        <div>
          <p className="text-[12px] font-500 uppercase tracking-wider text-red-600/70">Overdue Invoices</p>
          <p className="text-3xl font-700 tabular-nums text-red-700 mt-0.5">{analytics.payments.overdueInvoiceCount}</p>
        </div>
        <p className="text-[12px] text-red-600">${analytics.payments.overdueAmount.toLocaleString()} total outstanding</p>
      </div>
      {/* Card 4: Open Maintenance — WARNING */}
      <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="bg-amber-100 p-2.5 rounded-lg">
            <Wrench size={18} className="text-amber-600" />
          </div>
          {analytics.maintenance.criticalTickets > 0 && (
            <span className="text-[11px] font-600 bg-amber-500 text-white rounded-full px-2 py-0.5">
              {analytics.maintenance.criticalTickets} critical
            </span>
          )}
        </div>
        <div>
          <p className="text-[12px] font-500 uppercase tracking-wider text-amber-700/70">Open Tickets</p>
          <p className="text-3xl font-700 tabular-nums text-amber-800 mt-0.5">{analytics.maintenance.openTickets}</p>
        </div>
        <p className="text-[12px] text-amber-700">{analytics.maintenance.inProgressTickets} in progress</p>
      </div>
      {/* Card 5: Available Rooms */}
      <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="bg-blue-50 p-2.5 rounded-lg">
            <DoorOpen size={18} className="text-blue-600" />
          </div>
          {analytics.occupancy.underMaintenanceRooms > 0 && (
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-full px-2 py-0.5">
              {analytics.occupancy.underMaintenanceRooms} in maint.
            </span>
          )}
        </div>
        <div>
          <p className="text-[12px] font-500 uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Available Rooms</p>
          <p className="text-3xl font-700 tabular-nums text-[hsl(var(--foreground))] mt-0.5">{analytics.occupancy.availableRooms}</p>
        </div>
        <Link href="/room-management" className="text-[12px] text-[hsl(var(--primary))] hover:underline font-medium">
          View room inventory →
        </Link>
      </div>
      {/* Card 6: Monthly Revenue — col-span-2 to fill last row */}
      <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="bg-green-50 p-2.5 rounded-lg">
            <DollarSign size={18} className="text-green-600" />
          </div>
          <span className="flex items-center gap-1 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">
            {analytics.labels.monthYear}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-500 uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Revenue Collected</p>
            <p className="text-3xl font-700 tabular-nums text-[hsl(var(--foreground))] mt-0.5">${analytics.payments.netCollectedAmount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Pending collection</p>
            <p className="text-xl font-600 tabular-nums text-[hsl(var(--muted-foreground))]">
              ${analytics.payments.issuedAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${analytics.payments.collectionRate}%` }}
          />
        </div>
        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{analytics.payments.collectionRate}% of expected monthly rent collected</p>
      </div>
    </div>
  );
}
