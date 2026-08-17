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
  final_review_approved_at?: string | null;
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

  // Cash is verified first: any invoice that received cash (initial or a cash
  // due instalment) must clear Cash Review, then Final Review, before signing
  // status or a remaining due are even considered. Signing is NOT required to
  // enter this chain.
  const cashReviewRequired = invoice.cash_review_required ?? isCashInvoice(invoice);
  if (cashReviewRequired) {
    if (!invoice.cash_manager_approved_at) {
      return "cash_review";
    }
    if (!invoice.final_review_approved_at) {
      return "final_review";
    }

    // Both reviews cleared: apply the sign/due decision. Due always wins over
    // Not Signed.
    if (invoiceHasDue(invoice)) {
      return "due";
    }
    if (!hasSubmittedInvoice(invoice)) {
      return "not_signed";
    }
    return "approved";
  }

  // Non-cash: unchanged.
  if (!hasSubmittedInvoice(invoice)) {
    return "not_signed";
  }
  if (invoiceHasDue(invoice)) {
    return "due";
  }
  return "final_review";
};
