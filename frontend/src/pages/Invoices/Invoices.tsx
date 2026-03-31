import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import {
  Calendar as CalendarIcon,
  Edit,
  Eye,
  Lock,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Flatpickr from "react-flatpickr";

interface InvoiceRow {
  id: number;
  invoice_number: string;
  invoice_date: string;
  status: string;
  total: number;
  payment_method?: string | null;
  customer?: { first_name: string; last_name: string; email: string };
  branch?: { name: string };
  locked_at?: string | null;
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

const formatMoney = (value?: number) => `$${Number(value || 0).toFixed(2)}`;
const toDateInput = (dateStr: string) => dateStr;

const normalizeStatus = (status?: string) => (status || "").trim().toLowerCase();

const getStatusMeta = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (normalized === "approved") {
    return {
      label: "Approved",
      className:
        "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
    };
  }

  if (normalized === "draft") {
    return {
      label: "Draft",
      className:
        "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-300",
    };
  }

  return {
    label: status || "Pending",
    className:
      "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/12 dark:text-rose-300",
  };
};

const formatPaymentMethod = (value?: string | null) => {
  if (!value) return "Not set";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function Invoices() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "draft">("all");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    void fetchInvoices();
  }, []);

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

  const baseFiltered = rows.filter((row) => {
    const invoiceTerm = invoiceSearch.trim().toLowerCase();
    if (invoiceTerm && !(row.invoice_number || "").toLowerCase().includes(invoiceTerm)) {
      return false;
    }

    const customerTerm = customerSearch.trim().toLowerCase();
    if (customerTerm) {
      const customerName = `${row.customer?.first_name || ""} ${row.customer?.last_name || ""}`.toLowerCase();
      if (
        !customerName.includes(customerTerm) &&
        !(row.customer?.email || "").toLowerCase().includes(customerTerm)
      ) {
        return false;
      }
    }

    if (paymentMethod && (row.payment_method || "").toLowerCase() !== paymentMethod) {
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
      const normalized = normalizeStatus(row.status);
      const isPaid = normalized === "approved";
      const isDraft = normalized === "draft";
      const isUnpaid = !isPaid && !isDraft;

      acc.all += 1;
      acc.totalVolume += Number(row.total || 0);

      if (isPaid) {
        acc.paid += 1;
        acc.paidVolume += Number(row.total || 0);
      }

      if (isDraft) {
        acc.draft += 1;
      }

      if (isUnpaid) {
        acc.unpaid += 1;
        acc.unpaidVolume += Number(row.total || 0);
      }

      return acc;
    },
    {
      all: 0,
      paid: 0,
      unpaid: 0,
      draft: 0,
      totalVolume: 0,
      paidVolume: 0,
      unpaidVolume: 0,
    }
  );

  const filtered = baseFiltered.filter((row) => {
    const normalized = normalizeStatus(row.status);
    const isPaid = normalized === "approved";
    const isDraft = normalized === "draft";
    const isUnpaid = !isPaid && !isDraft;

    if (statusFilter === "paid" && !isPaid) return false;
    if (statusFilter === "draft" && !isDraft) return false;
    if (statusFilter === "unpaid" && !isUnpaid) return false;

    return true;
  });

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const activeFilterCount = [
    customerSearch.trim(),
    invoiceSearch.trim(),
    paymentMethod,
    dateFrom,
    dateTo,
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

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/78 dark:bg-none">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Invoices
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <SlidersHorizontal size={16} />
              {activeFilterCount} active filters
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <input
            type="text"
            placeholder="Search customer or email"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
          />

          <input
            type="text"
            placeholder="Search invoice number"
            value={invoiceSearch}
            onChange={(e) => {
              setInvoiceSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
          />

          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
          >
            <option value="">All payment methods</option>
            <option value="bkash">bkash</option>
            <option value="nagad">nagad</option>
            <option value="pos">POS</option>
            <option value="cash">cash</option>
            <option value="bank_transfer">bank transfer</option>
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Flatpickr
              value={dateFrom}
              onChange={(_, dateStr) => {
                setDateFrom(toDateInput(dateStr));
                setCurrentPage(1);
              }}
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              placeholder="From"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 pr-11 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <CalendarIcon size={18} />
            </span>
          </div>

          <div className="relative">
            <Flatpickr
              value={dateTo}
              onChange={(_, dateStr) => {
                setDateTo(toDateInput(dateStr));
                setCurrentPage(1);
              }}
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              placeholder="To"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 pr-11 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <CalendarIcon size={18} />
            </span>
          </div>
        </div>

        <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-blue-50 p-1.5 dark:bg-slate-900">
          {([
            { key: "paid", label: "Approved", count: statusCounts.paid },
            { key: "unpaid", label: "Needs attention", count: statusCounts.unpaid },
            { key: "draft", label: "Draft", count: statusCounts.draft },
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
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Invoice list</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Refreshing invoices..." : `${totalRows} invoices match the current view.`}
            </p>
          </div>

          <Link
            to="/dashboard/invoices/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Invoice
          </Link>
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="inline-flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-300">
              <span className="font-medium">Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 min-w-[4.5rem] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="font-medium">entries</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[24px] border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="w-14 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Branch</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                      No invoices found for this filter set.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => {
                    const statusMeta = getStatusMeta(row.status);

                    return (
                      <tr key={row.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                        <td className="py-4 text-center align-top">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.invoice_number || `INV-${row.id}`}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Invoice ID #{row.id}</div>
                          {row.locked_at ? (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Lock size={12} />
                              Locked
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {row.customer ? `${row.customer.first_name} ${row.customer.last_name}` : "-"}
                          </div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {row.customer?.email || "No email"}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-300">
                          {row.branch?.name || "-"}
                        </td>

                        <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-300">
                          {formatPaymentMethod(row.payment_method)}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top font-semibold text-slate-900 dark:text-slate-100">
                          {formatMoney(row.total)}
                        </td>

                        <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-300">
                          {formatDate(row.invoice_date)}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/dashboard/invoices/${row.id}/preview`}
                              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15"
                            >
                              <Eye size={14} />
                              Preview
                            </Link>

                            {!row.locked_at ? (
                              <Link
                                to={`/dashboard/invoices/${row.id}/edit`}
                                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                              >
                                <Edit size={14} />
                                Edit
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400 md:flex-row">
            <div className="rounded-full bg-slate-50 px-4 py-2 dark:bg-slate-900">
              Showing {totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalRows)} of {totalRows} entries
            </div>

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
          </div>
        </div>
      </section>
    </div>
  );
}
