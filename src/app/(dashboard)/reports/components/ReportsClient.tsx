'use client';
import React from 'react';
import { BarChart3, TrendingUp, BedDouble, DollarSign } from 'lucide-react';
import { occupancyTrendData, paymentCollectionData } from '@/lib/mockData';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

const ROOM_TYPE_COLORS = ['hsl(var(--primary))', '#60a5fa', '#34d399', '#f59e0b'];

export default function ReportsClient() {
  const { currentDorm, currentDormInvoices, currentDormRooms, currentDormTenants } = useDemoWorkspace();
  const totalRooms = currentDormRooms.length;
  const occupiedRooms = currentDormRooms.filter((room) => room.status === 'Occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const totalRevenue = currentDormInvoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const collectionRate = currentDormInvoices.length > 0
    ? Math.round((currentDormInvoices.filter((invoice) => invoice.status === 'Paid').length / currentDormInvoices.length) * 100)
    : 0;

  const roomTypeData = ['Single', 'Double', 'Triple', 'Suite'].map(type => ({
    name: type,
    value: currentDormRooms.filter((room) => room.type === type).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Reports & Analytics</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {currentDorm?.name ?? 'Active Dorm'} — March 2026
          </p>
        </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, sub: `${occupiedRooms}/${totalRooms} rooms`, icon: BedDouble, color: 'text-[hsl(var(--primary))]', bg: 'bg-[hsl(var(--primary)/0.08)]' },
          { label: 'Collection Rate', value: `${collectionRate}%`, sub: 'Invoices paid', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Revenue (Mar)', value: `$${totalRevenue.toLocaleString()}`, sub: 'Collected this month', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Tenants', value: String(currentDormTenants.length), sub: 'Active residents', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-[hsl(var(--border))] p-5">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">{card.value}</p>
            <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))] mt-0.5">{card.label}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Occupancy trend */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[hsl(var(--border))] p-6">
          <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-5">Occupancy Trend (30 days)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyTrendData}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[0, 12]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="occupied" name="Occupied" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#occGrad)" />
                <Area type="monotone" dataKey="available" name="Available" stroke="#94a3b8" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room type distribution */}
        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
          <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-5">Room Types</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roomTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {roomTypeData.map((_, i) => (
                    <Cell key={i} fill={ROOM_TYPE_COLORS[i % ROOM_TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {roomTypeData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROOM_TYPE_COLORS[i] }} />
                  <span className="text-[hsl(var(--muted-foreground))]">{d.name}</span>
                </div>
                <span className="font-medium text-[hsl(var(--foreground))]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment trend */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-5">Payment Collection (6 months)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentCollectionData} barSize={14} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="paid" name="Paid" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="issued" name="Issued" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" name="Overdue" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
