export type PaymentPreference = "cash" | "bank" | "bkash" | "nagad";
export type PaymentMethod = "cash" | "bank" | "bkash" | "nagad" | "cheque";

export type ExpenseStatus =
  | "submitted"
  | "finance_approved"
  | "finance_rejected"
  | "owner_rejected"
  | "money_provided"
  | "payment_rejected"
  | "paid";

export interface ExpenseCategoryItem {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ExpenseUserRef {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

export interface ExpensePayment {
  id: number;
  payment_method: PaymentMethod;
  transaction_ref: string | null;
  payment_date: string;
  amount_paid: string;
  receiver_name: string | null;
  notes: string | null;
  proof_path: string | null;
  proof_url?: string | null;
  recorded_by: ExpenseUserRef | null;
}

export interface PaymentRequestItem {
  id: number;
  employee: ExpenseUserRef;
  branch: { id: number; name: string } | null;
  category: ExpenseCategoryItem;
  amount: string;
  purpose: string;
  expense_date: string;
  payment_preference: PaymentPreference;
  receipt_path: string | null;
  receipt_url?: string | null;
  status: ExpenseStatus;
  finance_reviewed_at: string | null;
  finance_reviewer?: ExpenseUserRef | null;
  finance_note: string | null;
  finance_batch_id: string | null;
  finance_batch_summary?: {
    batch_id: string;
    request_count: number;
    total_amount: string;
    request_ids: number[];
  } | null;
  money_provided_paths: string[] | null;
  money_provided_urls?: string[] | null;
  owner_reviewed_at: string | null;
  owner_reviewer?: ExpenseUserRef | null;
  owner_note: string | null;
  used_receipt_paths: string[] | null;
  used_receipt_urls?: string[] | null;
  settled_at: string | null;
  settled_by?: ExpenseUserRef | null;
  amount_used: string | null;
  amount_returned: string | null;
  settlement_note: string | null;
  payment_rejected_at: string | null;
  payment_rejecter?: ExpenseUserRef | null;
  payment_note: string | null;
  payment: ExpensePayment | null;
  created_at: string;
}

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  submitted: "Pending Finance Review",
  finance_approved: "Pending Owner Approval",
  finance_rejected: "Rejected by Finance",
  owner_rejected: "Rejected by Owner",
  money_provided: "Money Provided — Awaiting Receipt",
  payment_rejected: "Cancelled by Finance",
  paid: "Settled",
};

export const STATUS_COLORS: Record<ExpenseStatus, string> = {
  submitted: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  finance_approved: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  finance_rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  owner_rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  money_provided: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  payment_rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};
