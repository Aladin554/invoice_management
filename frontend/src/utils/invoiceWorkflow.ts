export type InvoiceWorkflowStage = "not_signed" | "cash_review" | "final_review" | "approved";

export interface InvoiceWorkflowRecord {
  status?: string | null;
  payment_method?: string | null;
  student_signed_at?: string | null;
  customer_profile_submitted_at?: string | null;
  cash_manager_approved_at?: string | null;
  super_admin_approved_at?: string | null;
}

const normalizeValue = (value?: string | null) => (value || "").trim().toLowerCase();

export const isCashInvoice = (invoice: InvoiceWorkflowRecord) =>
  normalizeValue(invoice.payment_method) === "cash";

export const hasSubmittedInvoice = (invoice: InvoiceWorkflowRecord) =>
  Boolean(invoice.student_signed_at || invoice.customer_profile_submitted_at);

export const getInvoiceWorkflowStage = (
  invoice: InvoiceWorkflowRecord,
): InvoiceWorkflowStage => {
  if (normalizeValue(invoice.status) === "approved" || invoice.super_admin_approved_at) {
    return "approved";
  }

  if (!hasSubmittedInvoice(invoice)) {
    return "not_signed";
  }

  if (isCashInvoice(invoice) && !invoice.cash_manager_approved_at) {
    return "cash_review";
  }

  return "final_review";
};
