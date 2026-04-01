'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import {
  buildPaymentSummary,
  buildPaymentTrendData,
  getLatestInvoicePayment,
  sortPaymentsDescending,
} from '@/lib/domain/paymentAnalytics';
import type { WorkspacePaymentRecord } from '@/lib/demoWorkspace';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const paymentStatusMeta: Record<
  WorkspacePaymentRecord['status'],
  {
    badge: string;
    icon: React.ElementType;
    iconWrap: string;
  }
> = {
  paid: {
    badge: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
    iconWrap: 'bg-green-100 text-green-600',
  },
  pending: {
    badge: 'bg-blue-100 text-blue-700',
    icon: Clock3,
    iconWrap: 'bg-blue-100 text-blue-600',
  },
  failed: {
    badge: 'bg-red-100 text-red-700',
    icon: XCircle,
    iconWrap: 'bg-red-100 text-red-600',
  },
  refunded: {
    badge: 'bg-amber-100 text-amber-700',
    icon: CreditCard,
    iconWrap: 'bg-amber-100 text-amber-600',
  },
};

function formatPaymentStatus(status: WorkspacePaymentRecord['status']) {
  if (status === 'pending') {
    return 'Pending Review';
  }

  if (status === 'failed') {
    return 'Rejected';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PaymentsClient() {
  const {
    currentDorm,
    currentDormInvoices,
    currentDormPayments,
    recordInvoicePayment,
    rejectInvoicePayment,
  } = useDemoWorkspace();
  const paymentSummary = useMemo(
    () => buildPaymentSummary(currentDormInvoices, currentDormPayments),
    [currentDormInvoices, currentDormPayments],
  );
  const trendData = useMemo(
    () => buildPaymentTrendData(currentDormPayments, currentDormInvoices),
    [currentDormInvoices, currentDormPayments],
  );
  const recentPayments = useMemo(
    () => sortPaymentsDescending(currentDormPayments).slice(0, 8),
    [currentDormPayments],
  );

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[hsl(var(--primary))] text-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={20} className="opacity-80" />
            <span className="text-[12px] opacity-70">
              {paymentSummary.successfulPaymentCount} confirmed
            </span>
          </div>
          <p className="text-3xl font-700">${paymentSummary.netCollectedAmount.toLocaleString()}</p>
          <p className="text-[13px] opacity-70 mt-1">Net collected from recorded payments</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-[12px] font-medium text-red-700 uppercase tracking-wider">Outstanding</span>
          </div>
          <p className="text-3xl font-700 text-red-800">${paymentSummary.outstandingAmount.toLocaleString()}</p>
          <p className="text-[12px] text-red-600 mt-1">
            ${paymentSummary.overdueAmount.toLocaleString()} overdue across unpaid invoices
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-[12px] font-medium text-green-700 uppercase tracking-wider">Collection Rate</span>
          </div>
          <p className="text-3xl font-700 text-green-800">{paymentSummary.collectionRate}%</p>
          <p className="text-[12px] text-green-600 mt-1">
            {paymentSummary.pendingPaymentCount} pending review · {paymentSummary.failedPaymentCount} rejected attempts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))] mb-5">6-Month Payment Activity</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))] mb-4">Payment History</h2>
        <div className="space-y-2">
          {recentPayments.map((payment) => {
            const meta = paymentStatusMeta[payment.status];
            const StatusIcon = meta.icon;
            const happenedAt = payment.completedAt ?? payment.initiatedAt;
            const actionablePending =
              payment.status === 'pending'
              && getLatestInvoicePayment(currentDormPayments, payment.invoiceId, ['pending'])?.id === payment.id;

            return (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.iconWrap}`}>
                    <StatusIcon size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{payment.tenantName}</p>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
                        {formatPaymentStatus(payment.status)}
                      </span>
                    </div>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
                      Room {payment.roomNumber} · {payment.invoicePeriod} · {payment.reference}
                    </p>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
                      {payment.methodLabel} · Updated by {payment.recordedByName}
                    </p>
                    {payment.failureReason && (
                      <p className="text-[12px] text-red-600">{payment.failureReason}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">${payment.amount.toLocaleString()}</p>
                  <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{new Date(happenedAt).toLocaleDateString()}</p>
                  {actionablePending && (
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            recordInvoicePayment(payment.invoiceId);
                            toast.success(`Payment confirmed for ${payment.invoicePeriod}`);
                          } catch (error) {
                            const message = error instanceof Error ? error.message : 'Unable to confirm the payment.';
                            toast.error(message);
                          }
                        }}
                        className="text-[12px] font-medium text-green-700 hover:underline"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            rejectInvoicePayment(payment.invoiceId);
                            toast.success(`Payment rejected for ${payment.invoicePeriod}`);
                          } catch (error) {
                            const message = error instanceof Error ? error.message : 'Unable to reject the payment.';
                            toast.error(message);
                          }
                        }}
                        className="text-[12px] font-medium text-red-600 hover:underline"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {recentPayments.length === 0 && (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] px-4 py-8 text-center">
              <p className="text-[13px] text-[hsl(var(--muted-foreground))]">No payment activity recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
