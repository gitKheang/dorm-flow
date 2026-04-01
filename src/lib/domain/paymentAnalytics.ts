import type {
  PaymentStatus,
  WorkspaceInvoiceRecord,
  WorkspacePaymentRecord,
} from "@/lib/demoWorkspace";

type InvoicePaymentSummaryInput = Pick<
  WorkspaceInvoiceRecord,
  "amount" | "issuedDate" | "status"
>;

export interface PaymentSummary {
  totalCollectedAmount: number;
  refundedAmount: number;
  netCollectedAmount: number;
  pendingPaymentAmount: number;
  failedPaymentAmount: number;
  successfulPaymentCount: number;
  pendingPaymentCount: number;
  failedPaymentCount: number;
  paidInvoiceCount: number;
  issuedInvoiceCount: number;
  overdueInvoiceCount: number;
  collectibleInvoiceCount: number;
  issuedAmount: number;
  overdueAmount: number;
  outstandingAmount: number;
  totalExpectedAmount: number;
  collectionRate: number;
  invoiceSettlementRate: number;
}

export interface PaymentTrendPoint {
  month: string;
  paid: number;
  pending: number;
  failed: number;
}

function parseDateValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(
    value.includes("T") ? value : `${value}T00:00:00.000Z`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMonthKey(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function getPaymentSortTime(payment: WorkspacePaymentRecord) {
  return (
    parseDateValue(payment.completedAt ?? payment.initiatedAt)?.getTime() ?? 0
  );
}

function hasStatusFilter(
  payment: WorkspacePaymentRecord,
  statuses?: PaymentStatus[],
) {
  return !statuses || statuses.includes(payment.status);
}

function resolveAnchorDate(
  payments: WorkspacePaymentRecord[],
  invoices: InvoicePaymentSummaryInput[],
  referenceDate: Date,
) {
  const timestamps = [
    ...payments.map((payment) => getPaymentSortTime(payment)),
    ...invoices.map((invoice) => parseDateValue(invoice.issuedDate)?.getTime() ?? 0),
  ].filter((value) => value > 0);

  return timestamps.length > 0
    ? new Date(Math.max(...timestamps))
    : referenceDate;
}

export function sortPaymentsDescending(payments: WorkspacePaymentRecord[]) {
  return [...payments].sort(
    (left, right) => getPaymentSortTime(right) - getPaymentSortTime(left),
  );
}

export function getLatestInvoicePayment(
  payments: WorkspacePaymentRecord[],
  invoiceId: string,
  statuses?: PaymentStatus[],
) {
  return sortPaymentsDescending(
    payments.filter(
      (payment) =>
        payment.invoiceId === invoiceId && hasStatusFilter(payment, statuses),
    ),
  )[0];
}

export function buildPaymentSummary(
  invoices: InvoicePaymentSummaryInput[],
  payments: WorkspacePaymentRecord[],
): PaymentSummary {
  const collectibleInvoices = invoices.filter((invoice) => invoice.status !== "Draft");
  const totalExpectedAmount = collectibleInvoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );
  const paidInvoiceCount = collectibleInvoices.filter(
    (invoice) => invoice.status === "Paid",
  ).length;
  const issuedInvoiceCount = invoices.filter(
    (invoice) => invoice.status === "Issued",
  ).length;
  const overdueInvoiceCount = invoices.filter(
    (invoice) => invoice.status === "Overdue",
  ).length;
  const issuedAmount = invoices
    .filter((invoice) => invoice.status === "Issued")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = invoices
    .filter((invoice) => invoice.status === "Overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalCollectedAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const refundedAmount = payments
    .filter((payment) => payment.status === "refunded")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const netCollectedAmount = Math.max(totalCollectedAmount - refundedAmount, 0);

  return {
    totalCollectedAmount,
    refundedAmount,
    netCollectedAmount,
    pendingPaymentAmount: payments
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0),
    failedPaymentAmount: payments
      .filter((payment) => payment.status === "failed")
      .reduce((sum, payment) => sum + payment.amount, 0),
    successfulPaymentCount: payments.filter((payment) => payment.status === "paid")
      .length,
    pendingPaymentCount: payments.filter((payment) => payment.status === "pending")
      .length,
    failedPaymentCount: payments.filter((payment) => payment.status === "failed")
      .length,
    paidInvoiceCount,
    issuedInvoiceCount,
    overdueInvoiceCount,
    collectibleInvoiceCount: collectibleInvoices.length,
    issuedAmount,
    overdueAmount,
    outstandingAmount: issuedAmount + overdueAmount,
    totalExpectedAmount,
    collectionRate:
      totalExpectedAmount > 0
        ? Math.min(
            100,
            Math.round((netCollectedAmount / totalExpectedAmount) * 100),
          )
        : 0,
    invoiceSettlementRate:
      collectibleInvoices.length > 0
        ? Math.round((paidInvoiceCount / collectibleInvoices.length) * 100)
        : 0,
  };
}

export function buildPaymentTrendData(
  payments: WorkspacePaymentRecord[],
  invoices: InvoicePaymentSummaryInput[] = [],
  options?: {
    months?: number;
    referenceDate?: Date;
  },
): PaymentTrendPoint[] {
  const months = options?.months ?? 6;
  const referenceDate = options?.referenceDate ?? new Date();
  const anchorDate = resolveAnchorDate(payments, invoices, referenceDate);
  const anchorMonth = new Date(
    Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1),
  );
  const firstMonth = new Date(
    Date.UTC(
      anchorMonth.getUTCFullYear(),
      anchorMonth.getUTCMonth() - (months - 1),
      1,
    ),
  );

  const buckets = Array.from({ length: months }, (_, index) => {
    const monthDate = new Date(
      Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + index, 1),
    );
    return {
      key: getMonthKey(monthDate),
      month: getMonthLabel(monthDate),
      paid: 0,
      pending: 0,
      failed: 0,
    };
  });
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  payments.forEach((payment) => {
    const paymentDate = parseDateValue(payment.completedAt ?? payment.initiatedAt);
    if (!paymentDate) {
      return;
    }

    const bucket = bucketMap.get(getMonthKey(paymentDate));
    if (!bucket) {
      return;
    }

    if (payment.status === "paid") {
      bucket.paid += payment.amount;
      return;
    }

    if (payment.status === "pending") {
      bucket.pending += payment.amount;
      return;
    }

    if (payment.status === "failed") {
      bucket.failed += payment.amount;
      return;
    }

    bucket.paid = Math.max(bucket.paid - payment.amount, 0);
  });

  return buckets.map(({ key: _key, ...bucket }) => bucket);
}
