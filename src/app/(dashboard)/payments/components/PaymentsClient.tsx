'use client';
import React from 'react';
import { CreditCard, TrendingUp, DollarSign, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { paymentCollectionData } from '@/lib/mockData';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PaymentsClient() {
  const { currentDorm, currentDormInvoices } = useDemoWorkspace();
  const paidInvoices = currentDormInvoices.filter(i => i.status === 'Paid');
  const totalCollected = paidInvoices.reduce((s, i) => s + i.amount, 0);
  const overdueAmount = currentDormInvoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
  const collectionRate = currentDormInvoices.length > 0 ? Math.round((paidInvoices.length / currentDormInvoices.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Payments</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {currentDorm?.name ?? 'Dorm'} payment collection overview
          </p>
        </div>
        <button
          onClick={() => toast.info('Export payment report coming soon')}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <TrendingUp size={15} />
          Export Report
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[hsl(var(--primary))] text-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={20} className="opacity-80" />
            <span className="flex items-center gap-1 text-[12px] opacity-70">
              <ArrowUpRight size={12} />
              +8% vs last month
            </span>
          </div>
          <p className="text-3xl font-700">${totalCollected.toLocaleString()}</p>
          <p className="text-[13px] opacity-70 mt-1">Total collected this month</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-red-600" />
            <span className="text-[12px] font-medium text-red-700 uppercase tracking-wider">Outstanding</span>
          </div>
          <p className="text-3xl font-700 text-red-800">${overdueAmount.toLocaleString()}</p>
          <p className="text-[12px] text-red-600 mt-1">{currentDormInvoices.filter(i => i.status === 'Overdue').length} overdue invoices</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-[12px] font-medium text-green-700 uppercase tracking-wider">Collection Rate</span>
          </div>
          <p className="text-3xl font-700 text-green-800">{collectionRate}%</p>
          <p className="text-[12px] text-green-600 mt-1">{paidInvoices.length} of {currentDormInvoices.length} invoices paid</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))] mb-5">6-Month Collection Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentCollectionData} barSize={16} barGap={4}>
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

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))] mb-4">Recent Payments</h2>
        <div className="space-y-2">
          {paidInvoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{inv.tenantName}</p>
                  <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Room {inv.roomNumber} · {inv.period}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-green-700">${inv.amount.toLocaleString()}</p>
                <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{inv.issuedDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
