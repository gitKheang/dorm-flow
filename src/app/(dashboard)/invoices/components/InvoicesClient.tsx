"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoSession } from "@/components/DemoSessionProvider";
import { useDemoWorkspace } from "@/components/DemoWorkspaceProvider";
import ExportDialog from "@/components/ui/ExportDialog";
import {
  summarizeInvoiceLineItems,
  type WorkspacePaymentRecord,
} from "@/lib/demoWorkspace";
import {
  buildPaymentSummary,
  getLatestInvoicePayment,
} from "@/lib/domain/paymentAnalytics";
import { exportRowsToCsv, openPrintableExport } from "@/lib/export";
import type { Invoice } from "@/lib/mockData";
import { InvoiceStatus } from "@/lib/mockData";

const statusColors: Record<InvoiceStatus, string> = {
  Paid: "bg-green-100 text-green-700",
  Issued: "bg-blue-100 text-blue-700",
  Overdue: "bg-red-100 text-red-700",
  Draft: "bg-gray-100 text-gray-600",
};

const statusIcons: Record<InvoiceStatus, React.ElementType> = {
  Paid: CheckCircle2,
  Issued: Clock,
  Overdue: AlertTriangle,
  Draft: FileText,
};

function InvoiceBreakdown({
  invoice,
  compact = false,
}: {
  invoice: Invoice;
  compact?: boolean;
}) {
  const summary = summarizeInvoiceLineItems(invoice.lineItems);
  const mealLineItem = invoice.lineItems?.find(
    (lineItem) => lineItem.type === "mealCharges",
  );
  const rows = [
    {
      label: "Room rent",
      amount: summary.roomRent,
      description: "Base monthly room charge",
    },
    {
      label: "Meal charges",
      amount: summary.mealCharges,
      description: mealLineItem?.description ?? "No meal charges applied",
    },
    {
      label: "Late fee",
      amount: summary.lateFee,
      description:
        summary.lateFee > 0
          ? "Added after the invoice due date passed."
          : "No late fee on this invoice",
    },
    {
      label: "Adjustment",
      amount: summary.adjustment,
      description:
        summary.adjustment !== 0
          ? "Manual billing adjustment"
          : "No manual adjustment",
    },
  ];

  return (
    <div
      className={`rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.28)] ${
        compact ? "mt-4 p-4" : "p-4"
      }`}
    >
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 text-[13px]"
          >
            <div>
              <p className="font-medium text-[hsl(var(--foreground))]">
                {row.label}
              </p>
              <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                {row.description}
              </p>
            </div>
            <span className="font-medium text-[hsl(var(--foreground))]">
              ${row.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
        <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">
          Total
        </p>
        <p className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
          ${summary.total.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function TenantInvoicesView({
  invoices,
  payments,
  roomNumber,
  recordInvoicePayment,
}: {
  invoices: Invoice[];
  payments: WorkspacePaymentRecord[];
  roomNumber?: string;
  recordInvoicePayment: (invoiceId: string) => void;
}) {
  const outstanding = invoices.filter(
    (invoice) => invoice.status === "Issued" || invoice.status === "Overdue",
  );
  const paidTotal = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const overdueCount = invoices.filter(
    (invoice) => invoice.status === "Overdue",
  ).length;
  const nextDue = outstanding.find(
    (invoice) => !getLatestInvoicePayment(payments, invoice.id, ["pending"]),
  );
  const pendingReviewInvoice = outstanding.find((invoice) =>
    Boolean(getLatestInvoicePayment(payments, invoice.id, ["pending"])),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            My Invoices
          </h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {roomNumber
              ? `Billing for Room ${roomNumber}`
              : "Your billing history"}
          </p>
        </div>
        {(nextDue || pendingReviewInvoice) && (
          <button
            disabled={!nextDue}
            onClick={() => {
              if (!nextDue) {
                return;
              }

              try {
                recordInvoicePayment(nextDue.id);
                toast.success(`Payment submitted for ${nextDue.period}`);
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unable to record the payment.";
                toast.error(message);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
              nextDue
                ? "text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]"
                : "cursor-not-allowed bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            }`}
          >
            <CreditCard size={15} />
            {nextDue
              ? `Submit $${nextDue.amount} payment`
              : "Payment under review"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[hsl(var(--primary))] text-white rounded-xl p-5">
          <p className="text-[12px] uppercase tracking-wider opacity-70">
            Outstanding
          </p>
          <p className="mt-2 text-3xl font-700">
            $
            {outstanding
              .reduce((sum, invoice) => sum + invoice.amount, 0)
              .toLocaleString()}
          </p>
          <p className="mt-1 text-[13px] opacity-75">
            {outstanding.length
              ? `${outstanding.length} open invoice${outstanding.length > 1 ? "s" : ""}`
              : "Nothing due right now"}
          </p>
        </div>
        <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-green-700">
            Paid
          </p>
          <p className="mt-2 text-3xl font-700 text-[hsl(var(--foreground))]">
            ${paidTotal.toLocaleString()}
          </p>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
            Confirmed payments on record
          </p>
        </div>
        <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-red-700">
            Overdue
          </p>
          <p className="mt-2 text-3xl font-700 text-[hsl(var(--foreground))]">
            {overdueCount}
          </p>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
            Invoices that are past due
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => {
          const StatusIcon = statusIcons[invoice.status];
          const needsPayment =
            invoice.status === "Issued" || invoice.status === "Overdue";
          const latestPayment = getLatestInvoicePayment(payments, invoice.id);
          const pendingReview = latestPayment?.status === "pending";
          const rejectedPayment = latestPayment?.status === "failed";
          const receipt = getLatestInvoicePayment(payments, invoice.id, [
            "paid",
          ]);

          return (
            <div
              key={invoice.id}
              className="bg-white rounded-xl border border-[hsl(var(--border))] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
                      {invoice.period}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${statusColors[invoice.status]}`}
                    >
                      <StatusIcon size={11} />
                      {invoice.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
                    Invoice {invoice.id}{" "}
                    {roomNumber ? `for Room ${roomNumber}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[hsl(var(--muted-foreground))]">
                    <span>Issued {invoice.issuedDate}</span>
                    <span>Due {invoice.dueDate}</span>
                    {pendingReview && (
                      <span>Payment submitted and awaiting review</span>
                    )}
                    {rejectedPayment && !pendingReview && (
                      <span>Last submission was rejected</span>
                    )}
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-700 text-[hsl(var(--foreground))]">
                    ${invoice.amount.toLocaleString()}
                  </p>
                  <button
                    disabled={pendingReview}
                    onClick={() => {
                      if (needsPayment && !pendingReview) {
                        try {
                          recordInvoicePayment(invoice.id);
                          toast.success(
                            `Payment submitted for ${invoice.period}`,
                          );
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "Unable to record the payment.";
                          toast.error(message);
                        }
                        return;
                      }
                      toast.info(
                        receipt
                          ? `Payment reference: ${receipt.reference}`
                          : `No payment reference recorded for ${invoice.period}`,
                      );
                    }}
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                      needsPayment && !pendingReview
                        ? "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)]"
                        : pendingReview
                          ? "cursor-not-allowed bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                          : "bg-white text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                    }`}
                  >
                    {needsPayment ? (
                      <CreditCard size={15} />
                    ) : (
                      <FileText size={15} />
                    )}
                    {pendingReview
                      ? "Under review"
                      : needsPayment
                        ? rejectedPayment
                          ? "Resubmit payment"
                          : "Submit payment"
                        : "Payment reference"}
                  </button>
                </div>
              </div>
              <InvoiceBreakdown invoice={invoice} compact />
            </div>
          );
        })}
        {invoices.length === 0 && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-white px-6 py-10 text-center">
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">
              No invoices found for this account
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesClient() {
  const { session } = useDemoSession();
  const {
    currentDorm,
    currentDormInvoices,
    currentDormPayments,
    generateInvoices,
    recordInvoicePayment,
    rejectInvoicePayment,
    workspace,
  } = useDemoWorkspace();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "All">(
    "All",
  );
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const filtered = useMemo(() => {
    return currentDormInvoices.filter((invoice) => {
      const query = search.toLowerCase();
      const matchSearch =
        !query ||
        invoice.tenantName.toLowerCase().includes(query) ||
        invoice.roomNumber.includes(query) ||
        invoice.period.toLowerCase().includes(query);
      const matchStatus =
        filterStatus === "All" || invoice.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [currentDormInvoices, filterStatus, search]);

  const tenantInvoices = useMemo(() => {
    if (session?.role !== "Tenant" || !session.tenantId) return [];
    return workspace.invoices.filter(
      (invoice) =>
        invoice.tenantId === session.tenantId &&
        invoice.dormId === session.activeDorm.id,
    );
  }, [session, workspace.invoices]);
  const tenantPayments = useMemo(() => {
    if (session?.role !== "Tenant" || !session.tenantId) return [];
    return workspace.payments.filter(
      (payment) =>
        payment.tenantId === session.tenantId &&
        payment.dormId === session.activeDorm.id,
    );
  }, [session, workspace.payments]);
  const paymentSummary = useMemo(
    () => buildPaymentSummary(currentDormInvoices, currentDormPayments),
    [currentDormInvoices, currentDormPayments],
  );

  if (!session) {
    return null;
  }

  if (session.role === "Tenant") {
    return (
      <TenantInvoicesView
        invoices={tenantInvoices}
        payments={tenantPayments}
        roomNumber={session.roomNumber}
        recordInvoicePayment={recordInvoicePayment}
      />
    );
  }

  const totalPaid = paymentSummary.netCollectedAmount;
  const totalOverdue = paymentSummary.overdueAmount;
  const totalIssued = paymentSummary.issuedAmount;

  function handleExport(format: "csv" | "pdf") {
    const exportRows = filtered.map((invoice) => {
      const summary = summarizeInvoiceLineItems(invoice.lineItems);
      const mealLineItem = invoice.lineItems?.find(
        (lineItem) => lineItem.type === "mealCharges",
      );
      return {
        invoiceId: invoice.id,
        tenantName: invoice.tenantName,
        roomNumber: invoice.roomNumber,
        period: invoice.period,
        status: invoice.status,
        dueDate: invoice.dueDate,
        roomRent: summary.roomRent,
        mealCharges: summary.mealCharges,
        mealCalculation: mealLineItem?.description ?? "No meal charges",
        lateFee: summary.lateFee,
        adjustment: summary.adjustment,
        total: summary.total,
      };
    });
    const columns = [
      { key: "invoiceId", label: "Invoice", accessor: (row: (typeof exportRows)[number]) => row.invoiceId },
      { key: "tenantName", label: "Resident", accessor: (row: (typeof exportRows)[number]) => row.tenantName },
      { key: "roomNumber", label: "Room", accessor: (row: (typeof exportRows)[number]) => `Room ${row.roomNumber}` },
      { key: "period", label: "Period", accessor: (row: (typeof exportRows)[number]) => row.period },
      { key: "status", label: "Status", accessor: (row: (typeof exportRows)[number]) => row.status },
      { key: "dueDate", label: "Due Date", accessor: (row: (typeof exportRows)[number]) => row.dueDate },
      { key: "roomRent", label: "Room Rent", accessor: (row: (typeof exportRows)[number]) => row.roomRent },
      { key: "mealCharges", label: "Meal Charges", accessor: (row: (typeof exportRows)[number]) => row.mealCharges },
      { key: "mealCalculation", label: "Meal Calculation", accessor: (row: (typeof exportRows)[number]) => row.mealCalculation },
      { key: "lateFee", label: "Late Fee", accessor: (row: (typeof exportRows)[number]) => row.lateFee },
      { key: "adjustment", label: "Adjustment", accessor: (row: (typeof exportRows)[number]) => row.adjustment },
      { key: "total", label: "Total", accessor: (row: (typeof exportRows)[number]) => row.total },
    ];

    if (format === "csv") {
      exportRowsToCsv(
        `${(currentDorm?.name ?? "dorm").toLowerCase().replace(/\s+/g, "-")}-invoices.csv`,
        exportRows,
        columns,
      );
      toast.success("Invoice CSV exported");
    } else {
      openPrintableExport({
        title: `${currentDorm?.name ?? "Dorm"} invoice export`,
        subtitle: "Current visible invoice rows with line-item totals",
        rows: exportRows,
        columns,
      });
      toast.success("Invoice print view opened");
    }

    setShowExportDialog(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Invoices
          </h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {currentDorm?.name ?? "Dorm"} · {currentDormInvoices.length} invoices on file
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={() => {
              try {
                const createdCount = generateInvoices();
                if (createdCount === 0) {
                  toast.info(
                    "All active residents already have the next billing cycle ready.",
                  );
                  return;
                }
                toast.success(
                  `${createdCount} invoice${createdCount === 1 ? "" : "s"} generated.`,
                );
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unable to generate invoices.";
                toast.error(message);
              }
            }}
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
            <span className="text-[12px] font-medium text-green-700 uppercase tracking-wider">
              Collected
            </span>
          </div>
          <p className="text-2xl font-700 text-green-800">
            ${totalPaid.toLocaleString()}
          </p>
          <p className="text-[12px] text-green-600 mt-1">
            {
              currentDormInvoices.filter((invoice) => invoice.status === "Paid")
                .length
            }{" "}
            invoices paid
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-[12px] font-medium text-red-700 uppercase tracking-wider">
              Overdue
            </span>
          </div>
          <p className="text-2xl font-700 text-red-800">
            ${totalOverdue.toLocaleString()}
          </p>
          <p className="text-[12px] text-red-600 mt-1">
            {
              currentDormInvoices.filter(
                (invoice) => invoice.status === "Overdue",
              ).length
            }{" "}
            invoices overdue
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-[12px] font-medium text-blue-700 uppercase tracking-wider">
              Pending
            </span>
          </div>
          <p className="text-2xl font-700 text-blue-800">
            ${totalIssued.toLocaleString()}
          </p>
          <p className="text-[12px] text-blue-600 mt-1">
            {
              currentDormInvoices.filter(
                (invoice) => invoice.status === "Issued",
              ).length
            }{" "}
            invoices issued
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by resident, room, or period..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Paid", "Issued", "Overdue", "Draft"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 text-[13px] font-medium rounded-lg border transition-all ${
                  filterStatus === status
                    ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                    : "bg-white text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Invoice
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Resident
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Room
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Period
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filtered.map((invoice) => {
                const StatusIcon = statusIcons[invoice.status];
                const pendingReview = getLatestInvoicePayment(
                  currentDormPayments,
                  invoice.id,
                  ["pending"],
                );
                return (
                  <React.Fragment key={invoice.id}>
                  <tr
                    className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
                  >
                    <td className="px-5 py-4 text-[13px] font-mono text-[hsl(var(--muted-foreground))]">
                      {invoice.id}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium text-[hsl(var(--foreground))]">
                      {invoice.tenantName}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">
                      Room {invoice.roomNumber}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--foreground))]">
                      {invoice.period}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-[hsl(var(--foreground))]">
                      ${invoice.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">
                      {invoice.dueDate}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${statusColors[invoice.status]}`}
                      >
                        <StatusIcon size={11} />
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {pendingReview ? (
                          <>
                            <button
                              onClick={() => {
                                try {
                                  recordInvoicePayment(invoice.id);
                                  toast.success(`Payment confirmed for ${invoice.id}`);
                                } catch (error) {
                                  const message =
                                    error instanceof Error
                                      ? error.message
                                      : "Unable to confirm the payment.";
                                  toast.error(message);
                                }
                              }}
                              className="text-[12px] text-green-700 font-medium hover:underline"
                            >
                              Confirm payment
                            </button>
                            <button
                              onClick={() => {
                                try {
                                  rejectInvoicePayment(invoice.id);
                                  toast.success(`Payment rejected for ${invoice.id}`);
                                } catch (error) {
                                  const message =
                                    error instanceof Error
                                      ? error.message
                                      : "Unable to reject the payment.";
                                  toast.error(message);
                                }
                              }}
                              className="text-[12px] text-red-600 font-medium hover:underline"
                            >
                              Reject payment
                            </button>
                          </>
                        ) : invoice.status !== "Paid" && invoice.status !== "Draft" ? (
                          <button
                            onClick={() => {
                              try {
                                recordInvoicePayment(invoice.id);
                                toast.success(`Payment manually confirmed for ${invoice.id}`);
                              } catch (error) {
                                const message =
                                  error instanceof Error
                                    ? error.message
                                    : "Unable to mark the invoice as paid.";
                                toast.error(message);
                              }
                            }}
                            className="text-[12px] text-green-700 font-medium hover:underline"
                          >
                            Mark paid manually
                          </button>
                        ) : null}
                        <button
                          onClick={() =>
                            setExpandedInvoiceId((current) =>
                              current === invoice.id ? null : invoice.id,
                            )
                          }
                          className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline"
                        >
                          {expandedInvoiceId === invoice.id ? "Hide" : "View"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedInvoiceId === invoice.id && (
                    <tr className="bg-[hsl(var(--muted)/0.22)]">
                      <td colSpan={8} className="px-5 py-4">
                        <InvoiceBreakdown invoice={invoice} />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">
              No invoices match this filter
            </p>
          </div>
        )}
        <div className="px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
            Showing {filtered.length} of {currentDormInvoices.length} invoices
          </p>
        </div>
      </div>
      <ExportDialog
        description="Export the invoices currently shown in the table, including rent, meal charges, late fees, adjustments, and totals."
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        title="Export invoices"
      />
    </div>
  );
}
