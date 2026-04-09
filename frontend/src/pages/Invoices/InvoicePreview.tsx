import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomerProfileSummary from "../../components/invoices/CustomerProfileSummary";
import { getInvoiceWorkflowStage } from "../../utils/invoiceWorkflow";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleAlert,
  CircleDashed,
  Copy,
  Download,
  ExternalLink,
  PencilLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";

interface InvoiceData {
  invoice: any;
  header_text: string;
  footer_text: string;
  logo_url: string;
  public_link?: string;
  contract_download_url?: string | null;
  no_refund_contract_download_url?: string | null;
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

const getStatusMeta = (invoice: any) => {
  const stage = getInvoiceWorkflowStage(invoice);

  if (stage === "approved") {
    return {
      label: "Approved",
      className:
        "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
      icon: BadgeCheck,
    };
  }

  if (stage === "final_review") {
    return {
      label: "Final Review",
      className:
        "border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/12 dark:text-violet-300",
      icon: ShieldCheck,
    };
  }

  if (stage === "cash_review") {
    return {
      label: "Cash Review",
      className:
        "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-300",
      icon: ShieldCheck,
    };
  }

  return {
    label: "Not signed",
    className:
      "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-300",
    icon: CircleDashed,
  };
};

const getApprovedPdfUrl = (invoice: any, approvedPdfUrl?: string | null) => {
  if (approvedPdfUrl) return approvedPdfUrl;
  if (!invoice?.public_token) return null;

  return `/api/invoices/public/${invoice.public_token}/approved-pdf`;
};

const isCashReviewStage = (invoice: any) => getInvoiceWorkflowStage(invoice) === "cash_review";
const isFinalReviewStage = (invoice: any) => getInvoiceWorkflowStage(invoice) === "final_review";
const isNotSignedStage = (invoice: any) => getInvoiceWorkflowStage(invoice) === "not_signed";

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
      toast.success("Reminder sent successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send reminder");
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
      toast.success("Cash review approved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve cash review");
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

  const handleDownload = () => {
    if (!data) return;

    const pdfUrl = getApprovedPdfUrl(data.invoice, data.approved_pdf_url);
    if (!pdfUrl) {
      toast.error("Approved PDF is not ready yet");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleEditInvoice = () => {
    if (!id) return;
    navigate(`/dashboard/invoices/${id}/edit`);
  };

  const handleOpenPreview = () => {
    if (!data?.public_link) {
      toast.error("Preview link is not available yet");
      return;
    }

    window.open(data.public_link, "_blank", "noopener,noreferrer");
  };

  const handleCopyPreviewLink = async () => {
    if (!data?.public_link) {
      toast.error("Preview link is not available yet");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.public_link);
      } else {
        const input = document.createElement("input");
        input.value = data.public_link;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      toast.success("Preview link copied");
    } catch {
      toast.error("Failed to copy preview link");
    }
  };

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
  const statusMeta = getStatusMeta(invoice);
  const StatusIcon = statusMeta.icon;
  const isNotSigned = isNotSignedStage(invoice);
  const isCashReview = isCashReviewStage(invoice);
  const isFinalReview = isFinalReviewStage(invoice);
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const discountAmount =
    invoice.discount_type === "percent"
      ? (Number(invoice.subtotal || 0) * Number(invoice.discount_value || 0)) / 100
      : Number(invoice.discount_value || 0);
  const hasDiscount = discountAmount > 0;
  const discountLabel =
    invoice.discount_type === "percent" && Number(invoice.discount_value || 0) > 0
      ? `Discount (${Number(invoice.discount_value)}%)`
      : "Discount";
  const customerName = invoice.customer
    ? `${invoice.customer.first_name || ""} ${invoice.customer.last_name || ""}`.trim()
    : "No customer assigned";
  const customerPhone = invoice.customer?.phone || "-";
  const customerEmail = invoice.customer?.email || "-";
  const workspaceNote = (data.header_text || "").trim();
  const showWorkspaceNote = workspaceNote.length > 0 && workspaceNote.toLowerCase() !== "connected invoice";
  const headerGridClassName = showWorkspaceNote
    ? "grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)_240px] lg:items-center"
    : "grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center";
  const pdfUrl = getApprovedPdfUrl(invoice, data.approved_pdf_url);
  const invoiceSummaryRows = [
    { label: "Invoice Number", value: invoice.invoice_number || `INV-${invoice.id || id}` },
    { label: "Invoice Date", value: formatDate(invoice.invoice_date) },
    { label: "Payment Method", value: formatPaymentMethod(invoice.payment_method) },
  ];
  const detailGridClassName = permissions.can_assign_editor ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2";
  const actionStatusMessage =
    pendingAction === "approve"
      ? "Final approval is running. Please wait while the invoice is locked and the final PDF is prepared."
      : pendingAction === "approveCash"
        ? "Cash approval is being recorded. Please wait..."
        : pendingAction === "preview"
          ? "Reminder is being sent to the student. Please wait..."
          : null;

  const actionButtons = [
    {
      key: "preview",
      visible: isNotSigned && permissions.can_move_to_preview,
      onClick: handleMoveToPreview,
      label: pendingAction === "preview" ? "Sending..." : "Send reminder",
      className: "bg-blue-600 text-white hover:bg-blue-700",
      disabled: pendingAction !== null,
    },
    {
      key: "approveCash",
      visible: isCashReview && permissions.can_approve_cash,
      onClick: handleApproveCash,
      label: pendingAction === "approveCash" ? "Approving..." : "Approve",
      className: "bg-blue-600 text-white hover:bg-blue-700",
      disabled: pendingAction !== null,
    },
    {
      key: "approve",
      visible: (isCashReview || isFinalReview) && permissions.can_approve,
      onClick: handleApprove,
      label: pendingAction === "approve" ? "Approving..." : "Approve",
      className: "bg-blue-600 text-white hover:bg-blue-700",
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
          <button
            type="button"
            onClick={handleEditInvoice}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <PencilLine size={15} className="mr-2 inline-flex" />
            Edit
          </button>

          <button
            type="button"
            onClick={handleOpenPreview}
            disabled={!data.public_link}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ExternalLink size={15} className="mr-2 inline-flex" />
            Preview
          </button>

          <button
            type="button"
            onClick={handleCopyPreviewLink}
            disabled={!data.public_link}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Copy size={15} className="mr-2 inline-flex" />
            Copy
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfUrl}
            className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
          >
            <Download size={15} className="mr-2 inline-flex" />
            {pdfUrl ? "Download" : "PDF unavailable"}
          </button>

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
                {button.key === "download" ? <Download size={15} className="mr-2 inline-flex" /> : null}
                {button.label}
              </button>
            ))}
        </div>
      </div>

      {actionStatusMessage ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{actionStatusMessage}</span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/90">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.16),_transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-6 py-7 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] sm:px-8 lg:px-10 lg:py-8">
          <div className={headerGridClassName}>
            <div className="flex min-h-[112px] items-center justify-center lg:justify-start">
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt="Connected logo"
                  className="max-h-[110px] w-auto object-contain"
                />
              ) : (
                <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Connected.
                </div>
              )}
            </div>

            {showWorkspaceNote ? (
              <div className="flex min-h-[112px] items-center justify-center text-center">
                <div className="w-full max-w-[320px] rounded-[24px] border border-slate-200 bg-white/80 px-5 py-4 text-sm font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                  {workspaceNote}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col items-center gap-3 text-center lg:items-end lg:text-right">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${statusMeta.className}`}>
                <StatusIcon size={16} />
                {statusMeta.label}
              </span>

              <div className="text-xl font-light tracking-[0.08em] text-slate-800 dark:text-slate-100 sm:text-2xl">
                INVOICE
              </div>

              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
                <div>{invoice.branch?.name ? `${invoice.branch.name} Branch` : "Invoice workspace"}</div>
                <div>{data.footer_text || "Thank you for choosing Connected."}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 px-6 py-6 dark:border-slate-800 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:px-10">
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Bill To
            </div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{customerName}</div>
            <div className="text-sm">{customerPhone}</div>
            <div className="break-all text-sm">{customerEmail}</div>
          </div>

          <div className="w-full max-w-[340px] lg:justify-self-end">
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
              {invoiceSummaryRows.map((row) => (
                <div key={row.label} className="grid grid-cols-[124px_minmax(0,1fr)] items-start gap-x-6">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{row.label}:</span>
                  <span className="text-right tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <colgroup>
              <col />
              <col className="w-[170px]" />
            </colgroup>

            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5 sm:px-8 lg:px-10">Services / Items</th>
                <th className="px-6 py-3.5 text-right sm:px-8 lg:px-10">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.length > 0 ? (
                items.map((item: any, index: number) => (
                  <tr key={item.id ?? `${item.name}-${index}`} className="align-top">
                    <td className="px-6 py-3.5 sm:px-8 lg:px-10">
                      <div className="text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                        {item.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-100 sm:px-8 lg:px-10">
                      {formatMoney(item.line_total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 sm:px-8 lg:px-10">
                    No services have been added to this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:px-8 lg:px-10">
          <div className="ml-auto w-full max-w-[340px]">
            <div className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Subtotal</span>
                <span className="block w-full text-right tabular-nums">{formatMoney(invoice.subtotal)}</span>
              </div>

              {hasDiscount ? (
                <div className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{discountLabel}</span>
                  <span className="block w-full text-right tabular-nums">-{formatMoney(discountAmount)}</span>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 bg-slate-100 py-3 text-sm dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Total:</span>
                <span className="block w-full text-right text-lg font-semibold leading-none tabular-nums text-slate-900 dark:text-slate-100">
                  {formatMoney(invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      <CustomerProfileSummary
        profile={invoice.customer}
        title="Student Profile"
        subtitle="These details are saved from the public invoice review link and stored on the customer record."
        emptyMessage="No additional student profile details have been saved yet."
      />
    </div>
  );
}
