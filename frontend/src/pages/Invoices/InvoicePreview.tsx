import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomerProfileSummary from "../../components/invoices/CustomerProfileSummary";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleDashed,
  ExternalLink,
  FileText,
  Receipt,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

interface InvoiceData {
  invoice: any;
  header_text: string;
  footer_text: string;
  logo_url: string;
  public_link?: string;
  contract_download_url?: string | null;
  approved_pdf_url?: string | null;
  payment_evidence_url?: string | null;
  student_photo_url?: string | null;
  permissions?: {
    can_move_to_preview: boolean;
    can_approve_cash: boolean;
    can_approve: boolean;
    can_admin_sign: boolean;
    can_assign_editor: boolean;
  };
  workflow?: {
    requires_cash_approval: boolean;
    cash_approval_completed: boolean;
    super_admin_approval_completed: boolean;
  };
  editor_options?: EditorOption[];
}

interface EditorOption {
  id: number;
  first_name: string;
  last_name: string;
}

const formatDate = (value?: string) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatMoney = (value?: number | string | null) => `$${Number(value || 0).toFixed(2)}`;

const formatPaymentMethod = (value?: string | null) => {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusMeta = (status?: string) => {
  const normalized = (status || "").trim().toLowerCase();

  if (normalized === "approved") {
    return {
      label: "Approved",
      className:
        "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
      icon: BadgeCheck,
    };
  }

  if (normalized === "draft") {
    return {
      label: "Draft",
      className:
        "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-300",
      icon: CircleDashed,
    };
  }

  return {
    label: status || "Pending",
    className:
      "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/12 dark:text-blue-300",
    icon: ShieldCheck,
  };
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm ring-1 ring-blue-100/70 dark:border-slate-800 dark:bg-slate-900/80 dark:ring-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconClassName}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function ResourceLink({ label, href }: { label: string; href?: string | null }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
    >
      <span>{label}</span>
      <ExternalLink size={16} />
    </a>
  );
}

export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<null | "preview" | "approveCash" | "approve">(null);
  const [selectedEditorId, setSelectedEditorId] = useState("");

  useEffect(() => {
    if (id) void fetchInvoice(id);
  }, [id]);

  useEffect(() => {
    if (data?.invoice?.edit_override_user_id) {
      setSelectedEditorId(String(data.invoice.edit_override_user_id));
    }
  }, [data?.invoice?.edit_override_user_id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${invoiceId}`);
      setData(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice");
      navigate("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToPreview = async () => {
    if (!id) return;

    try {
      setPendingAction("preview");
      const res = await api.post<InvoiceData>(`/invoices/${id}/preview`);
      setData(res.data);
      toast.success("Invoice moved to preview. Student email is being sent.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to move to preview");
    } finally {
      setPendingAction(null);
    }
  };

  const handleApproveCash = async () => {
    if (!id) return;

    try {
      setPendingAction("approveCash");
      const res = await api.post<InvoiceData>(`/invoices/${id}/approve-cash`);
      setData(res.data);
      toast.success("Cash payment approved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve cash payment");
    } finally {
      setPendingAction(null);
    }
  };

  const handleApprove = async () => {
    if (!id) return;

    try {
      setPendingAction("approve");
      const res = await api.post<InvoiceData>(`/invoices/${id}/approve`);
      setData(res.data);
      toast.success("Invoice approved. Final documents are being prepared.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve invoice");
    } finally {
      setPendingAction(null);
    }
  };

  const handleAssignEditor = async () => {
    if (!id) return;
    if (!selectedEditorId) {
      toast.error("Select an admin to assign");
      return;
    }

    try {
      await api.post(`/invoices/${id}/assign-editor`, {
        edit_override_user_id: Number(selectedEditorId),
      });
      toast.success("Editor assigned");
      await fetchInvoice(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign editor");
    }
  };

  if (loading || !data) {
    return <div className="p-6 text-gray-500 dark:text-slate-400">Loading...</div>;
  }

  const { invoice } = data;
  const permissions = data.permissions ?? {
    can_move_to_preview: false,
    can_approve_cash: false,
    can_approve: false,
    can_admin_sign: false,
    can_assign_editor: false,
  };
  const editorOptions = Array.isArray(data.editor_options) ? data.editor_options : [];
  const assignedEditor = editorOptions.find((editor) => editor.id === invoice.edit_override_user_id);
  const statusMeta = getStatusMeta(invoice.status);
  const StatusIcon = statusMeta.icon;
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const discountAmount =
    invoice.discount_type === "percent"
      ? (Number(invoice.subtotal || 0) * Number(invoice.discount_value || 0)) / 100
      : Number(invoice.discount_value || 0);
  const customerName = invoice.customer
    ? `${invoice.customer.first_name || ""} ${invoice.customer.last_name || ""}`.trim()
    : "No customer assigned";
  const actionStatusMessage =
    pendingAction === "approve"
      ? "Final approval is running. Please wait while the invoice is locked and the final PDF is prepared."
      : pendingAction === "approveCash"
        ? "Cash approval is being recorded. Please wait..."
        : pendingAction === "preview"
          ? "Preview is being generated and the student email is being prepared. Please wait..."
          : null;

  const actionButtons = [
    {
      key: "preview",
      visible: permissions.can_move_to_preview,
      onClick: handleMoveToPreview,
      label: pendingAction === "preview" ? "Sending..." : "Move to Preview",
      className: "bg-blue-600 text-white hover:bg-blue-700",
      disabled: pendingAction !== null,
    },
    {
      key: "approveCash",
      visible: permissions.can_approve_cash,
      onClick: handleApproveCash,
      label: pendingAction === "approveCash" ? "Approving..." : "Approve Cash",
      className: "bg-amber-500 text-white hover:bg-amber-600",
      disabled: pendingAction !== null,
    },
    {
      key: "approve",
      visible: permissions.can_approve,
      onClick: handleApprove,
      label: pendingAction === "approve" ? "Approving..." : "Approve Invoice",
      className: "bg-emerald-600 text-white hover:bg-emerald-700",
      disabled: pendingAction !== null,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          onClick={() => navigate("/dashboard/invoices")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <ArrowLeft size={16} />
          Back to invoices
        </button>

        <div className="flex flex-wrap gap-2">
          {actionButtons
            .filter((button) => button.visible)
            .map((button) => (
              <button
                key={button.key}
                type="button"
                onClick={button.onClick}
                disabled={button.disabled}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${button.className}`}
              >
                {button.label}
              </button>
            ))}
        </div>
      </div>

      <section className="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/78 dark:bg-none">
        <div className="grid gap-6 xl:grid-cols-[1.45fr_.95fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-0">
              Invoice workspace
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {invoice.invoice_number || `Invoice #${invoice.id || id}`}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Review the customer details, services, workflow status, and downloadable
                  contract assets from one clean approval screen.
                </p>
              </div>

              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${statusMeta.className}`}>
                <StatusIcon size={16} />
                {statusMeta.label}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total amount"
                value={formatMoney(invoice.total)}
                icon={Wallet}
                iconClassName="bg-blue-100 text-blue-700"
              />
              <SummaryCard
                label="Invoice date"
                value={formatDate(invoice.invoice_date)}
                icon={CalendarDays}
                iconClassName="bg-sky-100 text-sky-700"
              />
              <SummaryCard
                label="Payment method"
                value={formatPaymentMethod(invoice.payment_method)}
                icon={Receipt}
                iconClassName="bg-indigo-100 text-indigo-700"
              />
              <SummaryCard
                label="Contract"
                value={invoice.contract_template?.name || "-"}
                icon={FileText}
                iconClassName="bg-violet-100 text-violet-700"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetaItem label="Customer" value={customerName} />
            <MetaItem label="Branch" value={invoice.branch?.name || "-"} />
            <MetaItem label="Header" value={data.header_text || "-"} />
            <MetaItem label="Footer note" value={data.footer_text || "-"} />
          </div>
        </div>
      </section>

      {actionStatusMessage ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{actionStatusMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Services and totals</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {items.length} line item{items.length === 1 ? "" : "s"} linked to this invoice.
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              Subtotal {formatMoney(invoice.subtotal)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.length > 0 ? (
                  items.map((item: any) => (
                    <tr key={item.id ?? item.name}>
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">{item.name || "-"}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatMoney(item.price)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatMoney(item.line_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                      No services have been added to this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/70 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Subtotal
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(invoice.subtotal)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Discount
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                -{formatMoney(discountAmount)}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                Total
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(invoice.total)}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <UserRound size={18} />
              Customer details
            </div>

            <div className="mt-4 grid gap-3">
              <MetaItem label="Customer name" value={customerName} />
              <MetaItem label="Email" value={invoice.customer?.email || "-"} />
              <MetaItem label="Phone" value={invoice.customer?.phone || "-"} />
              <MetaItem label="Branch" value={invoice.branch?.name || "-"} />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck size={18} />
              Workflow and files
            </div>

            <div className="mt-4 grid gap-3">
              <MetaItem label="Invoice status" value={statusMeta.label} />
              <MetaItem label="Payment method" value={formatPaymentMethod(invoice.payment_method)} />
              {data.workflow?.requires_cash_approval ? (
                <MetaItem
                  label="Cash approval"
                  value={
                    data.workflow.cash_approval_completed
                      ? formatDate(invoice.cash_manager_approved_at)
                      : "Pending"
                  }
                />
              ) : null}
              <MetaItem
                label="Super admin approval"
                value={
                  data.workflow?.super_admin_approval_completed
                    ? "Completed"
                    : "Pending"
                }
              />
            </div>

            <div className="mt-4 space-y-3">
              <ResourceLink label="Open payment evidence" href={data.payment_evidence_url} />
              <ResourceLink label="Download approved preview PDF" href={data.approved_pdf_url} />
              <ResourceLink label="Download contract file" href={data.contract_download_url} />
              <ResourceLink label="Open public share link" href={data.public_link} />
            </div>
          </section>

          {permissions.can_assign_editor ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <Building2 size={18} />
                Assign editor
              </div>

              <div className="mt-4 grid gap-3">
                <select
                  value={selectedEditorId}
                  onChange={(e) => setSelectedEditorId(e.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
                >
                  <option value="">Select admin</option>
                  {editorOptions.map((editor) => (
                    <option key={editor.id} value={editor.id}>
                      {editor.first_name} {editor.last_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignEditor}
                  className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Assign editor
                </button>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                  Current editor:{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {assignedEditor
                      ? `${assignedEditor.first_name} ${assignedEditor.last_name}`
                      : invoice.edit_override_user_id
                        ? `User #${invoice.edit_override_user_id}`
                        : "None"}
                  </span>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <CustomerProfileSummary
        profile={invoice.customer}
        title="Student Profile"
        subtitle="These details are saved from the public invoice review link and stored on the customer record."
        emptyMessage="No additional student profile details have been saved yet."
      />
    </div>
  );
}
