export type InvoiceWorkflowStage = "not_signed" | "due" | "cash_review" | "final_review" | "approved";

export interface InvoiceWorkflowRecord {
  status?: string | null;
  payment_method?: string | null;
  due_amount?: number | string | null;
  due_acknowledged_at?: string | null;
  cash_review_required?: boolean | null;
  student_signed_at?: string | null;
  customer_profile_submitted_at?: string | null;
  cash_manager_approved_at?: string | null;
  super_admin_approved_at?: string | null;
}

const normalizeValue = (value?: string | null) => (value || "").trim().toLowerCase();

// Only `cash` is cash; bkash/nagad/pos/bank_transfer are all non-cash.
export const isCashInvoice = (invoice: InvoiceWorkflowRecord) =>
  normalizeValue(invoice.payment_method) === "cash";

export const hasSubmittedInvoice = (invoice: InvoiceWorkflowRecord) =>
  Boolean(invoice.student_signed_at || invoice.customer_profile_submitted_at);

export const invoiceHasDue = (invoice: InvoiceWorkflowRecord) =>
  Number(invoice.due_amount || 0) > 0;

export const getInvoiceWorkflowStage = (
  invoice: InvoiceWorkflowRecord,
): InvoiceWorkflowStage => {
  if (normalizeValue(invoice.status) === "approved" || invoice.super_admin_approved_at) {
    return "approved";
  }

  if (!hasSubmittedInvoice(invoice)) {
    return "not_signed";
  }

  // Cash is verified first: any invoice that received cash (initial or a cash
  // due instalment) must clear Cash Review before it can move on — even while
  // a due still remains.
  const cashReviewRequired = invoice.cash_review_required ?? isCashInvoice(invoice);
  if (cashReviewRequired && !invoice.cash_manager_approved_at) {
    return "cash_review";
  }

  // Any outstanding due can never be approved until it is fully paid. A cash
  // invoice first passes through Final Review so the Super Admin confirms the
  // money received; clicking Approve there acknowledges it (never approves) and
  // drops it into the Due List. Non-cash dues go straight to the Due List.
  if (invoiceHasDue(invoice)) {
    if (cashReviewRequired && !invoice.due_acknowledged_at) {
      return "final_review";
    }
    return "due";
  }

  return "final_review";
};
