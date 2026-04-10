import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  Edit,
  Eye,
  Lock,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Flatpickr from "react-flatpickr";
import InlineFilterSelect from "../../components/common/InlineFilterSelect";
import { getMeCached, type Me } from "../../utils/me";
import {
  getInvoiceWorkflowStage,
  type InvoiceWorkflowStage,
} from "../../utils/invoiceWorkflow";
import { getDisplayReceiptNumber } from "../../utils/invoiceNumber";

interface InvoiceRow {
  id: number;
  invoice_number: string;
  display_invoice_number?: string;
  invoice_date: string;
  status: string;
  total: number;
  payment_method?: string | null;
  public_token?: string | null;
  preview_sent_at?: string | null;
  student_signed_at?: string | null;
  customer_profile_submitted_at?: string | null;
  cash_manager_approved_at?: string | null;
  super_admin_approved_at?: string | null;
  customer?: { first_name: string; last_name: string; email: string };
  branch?: { name: string };
  locked_at?: string | null;
}

interface InvoiceMutationResponse {
  invoice?: InvoiceRow;
}

type StatusFilter = "all" | InvoiceWorkflowStage;
type PendingAction = "reminder" | "approve" | "delete" | null;

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

const formatMoney = (value?: number) => `$${Number(value || 0).toFixed(2)}`;
const toDateInput = (dateStr: string) => dateStr;
const normalizeValue = (value?: string | null) => (value || "").trim().toLowerCase();

const getStatusMeta = (row: InvoiceRow) => {
  const stage = getInvoiceWorkflowStage(row);

  if (stage === "approved") {
    return {
      label: "Approved",
      className:
        "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
    };
  }

  if (stage === "final_review") {
    return {
      label: "Final Review",
      className:
        "border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/12 dark:text-violet-300",
    };
  }

  if (stage === "cash_review") {
    return {
      label: "Cash Review",
      className:
        "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-300",
    };
  }

  return {
    label: "Not signed",
    className:
      "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-300",
  };
};

const formatPaymentMethod = (value?: string | null) => {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getApprovedPdfUrl = (row: InvoiceRow) =>
  row.public_token ? `/api/invoices/public/${row.public_token}/approved-pdf` : null;

export default function Invoices() {
  const visibleTableColumnCount = 7;
  const actionToggleRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Me | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    void fetchInvoices();
    void loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const me = await getMeCached();
      setCurrentUser(me);
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/invoices");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceRow = (invoice: InvoiceRow) => {
    setRows((prev) => prev.map((row) => (row.id === invoice.id ? { ...row, ...invoice } : row)));
  };

  const isSuperAdmin = Number(currentUser?.role_id) === 1;
  const isAdmin = Number(currentUser?.role_id) === 2;

  const baseFiltered = rows.filter((row) => {
    const invoiceTerm = invoiceSearch.trim().toLowerCase();
    const receiptNumber = getDisplayReceiptNumber(
      row.invoice_number,
      row.display_invoice_number,
      row.id,
    ).toLowerCase();
    const rawInvoiceNumber = (row.invoice_number || "").toLowerCase();

    if (invoiceTerm && !receiptNumber.includes(invoiceTerm) && !rawInvoiceNumber.includes(invoiceTerm)) {
      return false;
    }

    const customerTerm = customerSearch.trim().toLowerCase();
    if (customerTerm) {
      const customerName =
        `${row.customer?.first_name || ""} ${row.customer?.last_name || ""}`.toLowerCase();
      if (
        !customerName.includes(customerTerm) &&
        !(row.customer?.email || "").toLowerCase().includes(customerTerm)
      ) {
        return false;
      }
    }

    if (paymentMethod && normalizeValue(row.payment_method) !== paymentMethod) {
      return false;
    }

    const rowDate = row.invoice_date ? new Date(row.invoice_date) : null;
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDateValue = dateTo ? new Date(dateTo) : null;

    if (rowDate && fromDate && !Number.isNaN(rowDate.getTime()) && rowDate < fromDate) {
      return false;
    }

    if (rowDate && toDateValue && !Number.isNaN(rowDate.getTime()) && rowDate > toDateValue) {
      return false;
    }

    return true;
  });

  const statusCounts = baseFiltered.reduce(
    (acc, row) => {
      const stage = getInvoiceWorkflowStage(row);
      acc.all += 1;
      acc[stage] += 1;
      return acc;
    },
    {
      all: 0,
      not_signed: 0,
      cash_review: 0,
      final_review: 0,
      approved: 0,
    },
  );

  const filtered = baseFiltered.filter((row) => {
    if (statusFilter === "all") return true;
    return getInvoiceWorkflowStage(row) === statusFilter;
  });

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectAll(filtered.length > 0 && filtered.every((row) => selected.includes(row.id)));
  }, [filtered, selected]);

  const activeFilterCount = [
    customerSearch.trim(),
    invoiceSearch.trim(),
    paymentMethod,
    dateFrom,
    dateTo,
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCustomerSearch("");
    setInvoiceSearch("");
    setPaymentMethod("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelected(next ? filtered.map((row) => row.id) : []);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const handleDateRangeChange = (_selectedDates: Date[], dateStr: string) => {
    const [from = "", to = ""] = dateStr.split(" to ");
    setDateFrom(toDateInput(from));
    setDateTo(toDateInput(to));
    setCurrentPage(1);
  };

  const handleSendReminder = async (row: InvoiceRow) => {
    try {
      setPendingRowId(row.id);
      setPendingAction("reminder");
      const res = await api.post<InvoiceMutationResponse>(`/invoices/${row.id}/preview`);
      if (res.data?.invoice) {
        updateInvoiceRow(res.data.invoice);
      }
      toast.success("Reminder sent successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send reminder");
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  };

  const handleApprove = async (row: InvoiceRow) => {
    const stage = getInvoiceWorkflowStage(row);

    let endpoint = "";
    let successMessage = "Invoice approved";

    if (stage === "cash_review" && isAdmin) {
      endpoint = `/invoices/${row.id}/approve-cash`;
      successMessage = "Cash review approved";
    } else if ((stage === "cash_review" || stage === "final_review") && isSuperAdmin) {
      endpoint = `/invoices/${row.id}/approve`;
    } else {
      return;
    }

    try {
      setPendingRowId(row.id);
      setPendingAction("approve");
      const res = await api.post<InvoiceMutationResponse>(endpoint);
      if (res.data?.invoice) {
        updateInvoiceRow(res.data.invoice);
      }
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve invoice");
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  };

  const handleDelete = async (row: InvoiceRow) => {
    const confirmed = window.confirm(
      `Delete receipt ${getDisplayReceiptNumber(row.invoice_number, row.display_invoice_number, row.id)}?`,
    );
    if (!confirmed) return;

    try {
      setPendingRowId(row.id);
      setPendingAction("delete");
      await api.delete(`/invoices/${row.id}`);
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setSelected((prev) => prev.filter((itemId) => itemId !== row.id));
      setOpenActionMenuId(null);
      toast.success("Invoice deleted successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete invoice");
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  };

  const handleDownload = (row: InvoiceRow) => {
    const pdfUrl = getApprovedPdfUrl(row);

    if (!pdfUrl) {
      toast.error("Approved PDF is not ready yet");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const dateRangeValue = [dateFrom, dateTo].filter(Boolean);

  return (
    <div className="mx-auto w-full">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Receipt list</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loading ? "Refreshing receipts..." : `${totalRows} receipts match the current view.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-50 px-4 text-sm font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <SlidersHorizontal size={15} />
                {activeFilterCount} active filters
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-slate-50/90 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear filters
              </button>

              <Link
                to="/dashboard/invoices/create"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Receipt
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px_190px]">
            <input
              type="text"
              placeholder="Search customer or email"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
            />

            <input
              type="text"
              placeholder="Search receipt number"
              value={invoiceSearch}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
            />

            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="panel-select h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-4 pr-11 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
            >
              <option value="">All payment methods</option>
              <option value="bkash">bkash</option>
              <option value="nagad">nagad</option>
              <option value="pos">POS</option>
              <option value="cash">cash</option>
              <option value="bank_transfer">bank transfer</option>
            </select>

            <div className="relative">
              <Flatpickr
                value={dateRangeValue}
                onChange={handleDateRangeChange}
                options={{ mode: "range", dateFormat: "Y-m-d", allowInput: true }}
                placeholder="From - To"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 pr-11 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <CalendarIcon size={18} />
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-blue-50 p-1.5 dark:bg-slate-900">
              {([
                { key: "not_signed", label: "Not signed", count: statusCounts.not_signed },
                { key: "cash_review", label: "Cash Review", count: statusCounts.cash_review },
                { key: "final_review", label: "Final Review", count: statusCounts.final_review },
                { key: "approved", label: "Approved", count: statusCounts.approved },
                { key: "all", label: "All invoices", count: statusCounts.all },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item.key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    statusFilter === item.key
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:ring-slate-700"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      statusFilter === item.key
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                        : "bg-white/80 text-slate-500 dark:bg-slate-950 dark:text-slate-400"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/60">
            <table className="w-full table-auto text-[13px] text-slate-700 dark:text-slate-200">
              <colgroup>
                <col style={{ width: "44px" }} /> {/* checkbox */}
                <col style={{ width: "132px" }} /> {/* status */}
                <col style={{ width: "126px" }} /> {/* date */}
                <col style={{ width: "118px" }} /> {/* receipt */}
                <col /> {/* customer grows to absorb extra space */}
                <col style={{ width: "132px" }} /> {/* amount */}
                <col style={{ width: "152px" }} /> {/* actions */}
              </colgroup>

              <thead className="bg-slate-50/80 text-left text-[12.5px] font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>

                  <th className="px-2 py-3">Status</th>

                  <th className="px-2 py-3 whitespace-nowrap">Date</th>

                  <th className="px-2 py-3">Receipt</th>

                  <th className="px-2 py-3">Customer</th>

                  <th className="px-2 py-3 whitespace-nowrap">Amount</th>

                  <th className="px-2 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleTableColumnCount}
                      className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Loading invoices...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleTableColumnCount}
                      className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No invoices found for this filter set.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => {
                    const stage = getInvoiceWorkflowStage(row);
                    const statusMeta = getStatusMeta(row);
                    const isRowPending = pendingRowId === row.id;
                    const canEdit = stage === "not_signed";
                    const canDelete = isSuperAdmin && stage === "not_signed";
                    const receiptLabel = getDisplayReceiptNumber(
                      row.invoice_number,
                      row.display_invoice_number,
                      row.id,
                    );
                    const customerLabel = row.customer
                      ? `${row.customer.first_name} ${row.customer.last_name}`.trim()
                      : "-";
                    const primaryAction =
                      stage === "approved"
                        ? {
                            label: "Download",
                            onClick: () => handleDownload(row),
                            className:
                              "inline-flex h-10 min-w-[94px] items-center justify-center rounded-l-[14px] border border-blue-200 bg-blue-50 px-2.5 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15",
                          }
                        : stage === "not_signed"
                          ? {
                              label: isRowPending && pendingAction === "reminder" ? "Sending..." : "Send reminder",
                              onClick: () => void handleSendReminder(row),
                              className:
                                "inline-flex h-10 min-w-[104px] items-center justify-center rounded-l-[14px] border border-blue-200 bg-blue-50 px-2.5 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15",
                            }
                          : ((stage === "cash_review" && (isAdmin || isSuperAdmin)) ||
                              (stage === "final_review" && isSuperAdmin))
                            ? {
                                label: isRowPending && pendingAction === "approve" ? "Approving..." : "Approve",
                                onClick: () => void handleApprove(row),
                                className:
                                  "inline-flex h-10 min-w-[94px] items-center justify-center rounded-l-[14px] border border-blue-200 bg-blue-50 px-2.5 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15",
                              }
                            : null;

                    return (
                      <tr key={row.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                        <td className="px-2.5 py-4 text-center align-top">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDate(row.invoice_date)}
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <div
                            className="font-semibold tabular-nums text-slate-900 dark:text-slate-100"
                            title={receiptLabel}
                          >
                            {receiptLabel}
                          </div>
                          {row.locked_at ? (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Lock size={12} />
                              Locked
                            </div>
                          ) : null}
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <div
                            className="max-w-[280px] truncate font-medium text-slate-900 dark:text-slate-100 xl:max-w-[360px]"
                            title={customerLabel}
                          >
                            {customerLabel}
                          </div>
                        </td>

                        <td className="px-2.5 py-4 align-top whitespace-nowrap font-semibold text-slate-900 dark:text-slate-100">
                          {formatMoney(row.total)}
                        </td>

                        {/* <td
                          className="px-2.5 py-4 align-top whitespace-nowrap text-slate-600 dark:text-slate-300"
                          title={row.branch?.name || "-"}
                        >
                          <span className="block truncate">{row.branch?.name || "-"}</span>
                        </td>

                        <td
                          className="px-2.5 py-4 align-top whitespace-nowrap text-slate-600 dark:text-slate-300"
                          title={formatPaymentMethod(row.payment_method)}
                        >
                          <span className="block truncate">{formatPaymentMethod(row.payment_method)}</span>
                        </td> */}

                        <td className="px-2.5 py-4 align-top">
                          <div className="flex justify-end">
                            <div className="relative inline-flex items-stretch">
                              {primaryAction ? (
                                <button
                                  type="button"
                                  onClick={primaryAction.onClick}
                                  disabled={isRowPending && stage !== "approved"}
                                  className={primaryAction.className}
                                >
                                  {stage === "approved" ? <Download size={15} className="mr-2" /> : null}
                                  {primaryAction.label}
                                </button>
                              ) : null}

                              <button
                                ref={(node) => {
                                  actionToggleRefs.current[row.id] = node;
                                }}
                                type="button"
                                onClick={() =>
                                  setOpenActionMenuId((prev) => (prev === row.id ? null : row.id))
                                }
                                className={`dropdown-toggle inline-flex h-10 w-8 items-center justify-center border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/20 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-slate-900 ${
                                  primaryAction ? "rounded-r-[14px] border-l-0" : "rounded-[14px]"
                                }`}
                              >
                                <ChevronDown size={18} />
                              </button>

                              <Dropdown
                                isOpen={openActionMenuId === row.id}
                                onClose={() => setOpenActionMenuId(null)}
                                portal
                                anchorElement={actionToggleRefs.current[row.id]}
                                className="min-w-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
                              >
                                <DropdownItem
                                  tag="a"
                                  to={`/dashboard/invoices/${row.id}/preview`}
                                  onItemClick={() => setOpenActionMenuId(null)}
                                  baseClassName="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900"
                                >
                                  <Eye size={15} />
                                  View
                                </DropdownItem>

                                {canEdit ? (
                                  <DropdownItem
                                    tag="a"
                                    to={`/dashboard/invoices/${row.id}/edit`}
                                    onItemClick={() => setOpenActionMenuId(null)}
                                    baseClassName="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900"
                                  >
                                    <Edit size={15} />
                                    Edit
                                  </DropdownItem>
                                ) : null}

                                {canDelete ? (
                                  <DropdownItem
                                    onClick={() => {
                                      void handleDelete(row);
                                    }}
                                    onItemClick={() => setOpenActionMenuId(null)}
                                    baseClassName="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                  >
                                    <Trash2 size={15} />
                                    {isRowPending && pendingAction === "delete" ? "Deleting..." : "Delete"}
                                  </DropdownItem>
                                ) : null}
                              </Dropdown>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
            <div className="rounded-full bg-slate-50 px-4 py-2 dark:bg-slate-900">
              Showing {totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalRows)} of {totalRows} entries
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`rounded-full border px-4 py-2 transition ${
                      num === currentPage
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Next
                </button>
              </div>

              <div className="inline-flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-300">
                <span className="font-medium">Show</span>
                <InlineFilterSelect
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  containerClassName="h-9 min-w-[4.5rem] rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20"
                  selectClassName="text-sm font-medium text-slate-700 dark:text-slate-100"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </InlineFilterSelect>
                <span className="font-medium">entries</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
