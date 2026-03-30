'use client';
import React, { useState, useMemo } from 'react';
import { Search, Plus, Download, FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { mockInvoices, InvoiceStatus } from '@/lib/mockData';

const statusColors: Record<InvoiceStatus, string> = {
  Paid: 'bg-green-100 text-green-700',
  Issued: 'bg-blue-100 text-blue-700',
  Overdue: 'bg-red-100 text-red-700',
  Draft: 'bg-gray-100 text-gray-600',
};

const statusIcons: Record<InvoiceStatus, React.ElementType> = {
  Paid: CheckCircle2,
  Issued: Clock,
  Overdue: AlertTriangle,
  Draft: FileText,
};

export default function InvoicesClient() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');

  const filtered = useMemo(() => {
    return mockInvoices.filter(inv => {
      const q = search.toLowerCase();
      const matchSearch = !q || inv.tenantName.toLowerCase().includes(q) || inv.roomNumber.includes(q) || inv.period.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || inv.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus]);

  const totalPaid = mockInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = mockInvoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
  const totalIssued = mockInvoices.filter(i => i.status === 'Issued').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Invoices</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {mockInvoices.length} invoices total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Exporting invoices...')}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={() => toast.info('Generate invoices feature coming soon')}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
          >
            <Plus size={15} />
            Generate Invoices
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-[12px] font-medium text-green-700 uppercase tracking-wider">Collected</span>
          </div>
          <p className="text-2xl font-700 text-green-800">${totalPaid.toLocaleString()}</p>
          <p className="text-[12px] text-green-600 mt-1">{mockInvoices.filter(i => i.status === 'Paid').length} invoices paid</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-[12px] font-medium text-red-700 uppercase tracking-wider">Overdue</span>
          </div>
          <p className="text-2xl font-700 text-red-800">${totalOverdue.toLocaleString()}</p>
          <p className="text-[12px] text-red-600 mt-1">{mockInvoices.filter(i => i.status === 'Overdue').length} invoices overdue</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-[12px] font-medium text-blue-700 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-700 text-blue-800">${totalIssued.toLocaleString()}</p>
          <p className="text-[12px] text-blue-600 mt-1">{mockInvoices.filter(i => i.status === 'Issued').length} invoices issued</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by tenant, room, or period..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Paid', 'Issued', 'Overdue', 'Draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-[13px] font-medium rounded-lg border transition-all ${
                filterStatus === s
                  ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                  : 'bg-white text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Invoice</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Room</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Period</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Due Date</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filtered.map(inv => {
                const SIcon = statusIcons[inv.status];
                return (
                  <tr key={inv.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-5 py-4 text-[13px] font-mono text-[hsl(var(--muted-foreground))]">{inv.id}</td>
                    <td className="px-5 py-4 text-[13px] font-medium text-[hsl(var(--foreground))]">{inv.tenantName}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">Room {inv.roomNumber}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--foreground))]">{inv.period}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-[hsl(var(--foreground))]">${inv.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">{inv.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${statusColors[inv.status]}`}>
                        <SIcon size={11} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toast.info(`Viewing invoice ${inv.id}`)}
                        className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No invoices found</p>
          </div>
        )}
        <div className="px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
            Showing {filtered.length} of {mockInvoices.length} invoices
          </p>
        </div>
      </div>
    </div>
  );
}
