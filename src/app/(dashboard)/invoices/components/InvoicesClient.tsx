'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { Invoice, InvoiceStatus, mockInvoices } from '@/lib/mockData';

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

function TenantInvoicesView({
  invoices,
  roomNumber,
}: {
  invoices: Invoice[];
  roomNumber?: string;
}) {
  const outstanding = invoices.filter((invoice) => invoice.status === 'Issued' || invoice.status === 'Overdue');
  const paidTotal = invoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueCount = invoices.filter((invoice) => invoice.status === 'Overdue').length;
  const nextDue = outstanding[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">My Invoices</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {roomNumber ? `Room ${roomNumber} billing history` : 'Personal billing history'}
          </p>
        </div>
        {nextDue && (
          <button
            onClick={() => toast.success(`Redirecting to payment for ${nextDue.period}...`)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
          >
            <CreditCard size={15} />
            Pay ${nextDue.amount}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[hsl(var(--primary))] text-white rounded-xl p-5">
          <p className="text-[12px] uppercase tracking-wider opacity-70">Outstanding</p>
          <p className="mt-2 text-3xl font-700">
            ${outstanding.reduce((sum, invoice) => sum + invoice.amount, 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[13px] opacity-75">
            {outstanding.length ? `${outstanding.length} invoice${outstanding.length > 1 ? 's' : ''} awaiting action` : 'Nothing due right now'}
          </p>
        </div>
        <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-green-700">Paid</p>
          <p className="mt-2 text-3xl font-700 text-[hsl(var(--foreground))]">${paidTotal.toLocaleString()}</p>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">Confirmed payments on record</p>
        </div>
        <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-red-700">Overdue</p>
          <p className="mt-2 text-3xl font-700 text-[hsl(var(--foreground))]">{overdueCount}</p>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">Invoices that need immediate payment</p>
        </div>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => {
          const StatusIcon = statusIcons[invoice.status];
          const needsPayment = invoice.status === 'Issued' || invoice.status === 'Overdue';

          return (
            <div key={invoice.id} className="bg-white rounded-xl border border-[hsl(var(--border))] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-[hsl(var(--foreground))]">{invoice.period}</p>
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${statusColors[invoice.status]}`}>
                      <StatusIcon size={11} />
                      {invoice.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
                    Invoice {invoice.id} {roomNumber ? `for Room ${roomNumber}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[hsl(var(--muted-foreground))]">
                    <span>Issued {invoice.issuedDate}</span>
                    <span>Due {invoice.dueDate}</span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-700 text-[hsl(var(--foreground))]">${invoice.amount.toLocaleString()}</p>
                  <button
                    onClick={() => {
                      if (needsPayment) {
                        toast.success(`Redirecting to payment for ${invoice.period}...`);
                        return;
                      }
                      toast.info(`Viewing receipt for ${invoice.period}`);
                    }}
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                      needsPayment
                        ? 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)]'
                        : 'bg-white text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    {needsPayment ? <CreditCard size={15} /> : <FileText size={15} />}
                    {needsPayment ? 'Pay now' : 'View receipt'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {invoices.length === 0 && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-white px-6 py-10 text-center">
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No invoices found for this account</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesClient() {
  const { session } = useDemoSession();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');

  const filtered = useMemo(() => {
    return mockInvoices.filter((invoice) => {
      const query = search.toLowerCase();
      const matchSearch =
        !query ||
        invoice.tenantName.toLowerCase().includes(query) ||
        invoice.roomNumber.includes(query) ||
        invoice.period.toLowerCase().includes(query);
      const matchStatus = filterStatus === 'All' || invoice.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [filterStatus, search]);

  const tenantInvoices = useMemo(() => {
    if (session?.role !== 'Tenant' || !session.tenantId) return [];
    return mockInvoices.filter((invoice) => invoice.tenantId === session.tenantId);
  }, [session]);

  if (!session) {
    return null;
  }

  if (session.role === 'Tenant') {
    return <TenantInvoicesView invoices={tenantInvoices} roomNumber={session.roomNumber} />;
  }

  const totalPaid = mockInvoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalOverdue = mockInvoices.filter((invoice) => invoice.status === 'Overdue').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalIssued = mockInvoices.filter((invoice) => invoice.status === 'Issued').reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-[12px] font-medium text-green-700 uppercase tracking-wider">Collected</span>
          </div>
          <p className="text-2xl font-700 text-green-800">${totalPaid.toLocaleString()}</p>
          <p className="text-[12px] text-green-600 mt-1">{mockInvoices.filter((invoice) => invoice.status === 'Paid').length} invoices paid</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-[12px] font-medium text-red-700 uppercase tracking-wider">Overdue</span>
          </div>
          <p className="text-2xl font-700 text-red-800">${totalOverdue.toLocaleString()}</p>
          <p className="text-[12px] text-red-600 mt-1">{mockInvoices.filter((invoice) => invoice.status === 'Overdue').length} invoices overdue</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-[12px] font-medium text-blue-700 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-700 text-blue-800">${totalIssued.toLocaleString()}</p>
          <p className="text-[12px] text-blue-600 mt-1">{mockInvoices.filter((invoice) => invoice.status === 'Issued').length} invoices issued</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by tenant, room, or period..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Paid', 'Issued', 'Overdue', 'Draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 text-[13px] font-medium rounded-lg border transition-all ${
                filterStatus === status
                  ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                  : 'bg-white text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

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
              {filtered.map((invoice) => {
                const StatusIcon = statusIcons[invoice.status];
                return (
                  <tr key={invoice.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-5 py-4 text-[13px] font-mono text-[hsl(var(--muted-foreground))]">{invoice.id}</td>
                    <td className="px-5 py-4 text-[13px] font-medium text-[hsl(var(--foreground))]">{invoice.tenantName}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">Room {invoice.roomNumber}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--foreground))]">{invoice.period}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-[hsl(var(--foreground))]">${invoice.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">{invoice.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${statusColors[invoice.status]}`}>
                        <StatusIcon size={11} />
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toast.info(`Viewing invoice ${invoice.id}`)}
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
