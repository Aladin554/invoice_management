import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { Calendar as CalendarIcon, Edit, Eye, Plus } from "lucide-react";
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

const formatDate = (value?: string) => (value ? new Date(value).toISOString().split("T")[0] : "-");
const toDateInput = (dateStr: string) => dateStr;

export default function Invoices() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "draft">("all");

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
    if (invoiceTerm) {
      if (!(row.invoice_number || "").toLowerCase().includes(invoiceTerm)) {
        return false;
      }
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

    const rowDate = formatDate(row.invoice_date);
    if (dateFrom && rowDate !== "-" && rowDate < dateFrom) return false;
    if (dateTo && rowDate !== "-" && rowDate > dateTo) return false;

    return true;
  });

  const statusCounts = baseFiltered.reduce(
    (acc, row) => {
      const normalizedStatus = (row.status || "").toLowerCase();
      const isPaid = normalizedStatus === "approved";
      const isDraft = normalizedStatus === "draft";
      const isUnpaid = !isPaid && !isDraft;

      acc.all += 1;
      if (isPaid) acc.paid += 1;
      if (isDraft) acc.draft += 1;
      if (isUnpaid) acc.unpaid += 1;

      return acc;
    },
    { all: 0, paid: 0, unpaid: 0, draft: 0 }
  );

  const filtered = baseFiltered.filter((row) => {
    const normalizedStatus = (row.status || "").toLowerCase();
    const isPaid = normalizedStatus === "approved";
    const isDraft = normalizedStatus === "draft";
    const isUnpaid = !isPaid && !isDraft;

    if (statusFilter === "paid" && !isPaid) return false;
    if (statusFilter === "draft" && !isDraft) return false;
    if (statusFilter === "unpaid" && !isUnpaid) return false;

    return true;
  });

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 dark:bg-gray-900 bg-white relative w-full max-w-[1200px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-3">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Invoices
        </h1>
        <Link
          to="/dashboard/invoices/create"
          className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white text-base font-medium shadow-sm hover:bg-blue-700 transition-all"
        >
          <Plus size={20} /> Create Invoice
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="Customers (search)"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-base placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <input
          type="text"
          placeholder="Invoice # (search)"
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-base placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:col-span-1"
        />
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-base text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:col-span-1"
        >
          <option value="">Mode of payment</option>
          <option value="bkash">bkash</option>
          <option value="nagad">nagad</option>
          <option value="pos">POS</option>
          <option value="cash">cash</option>
          <option value="bank_transfer">bank transfer</option>
        </select>
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          <div className="relative w-full flatpickr-wrapper">
            <Flatpickr
              value={dateFrom}
              onChange={(_, dateStr) => setDateFrom(toDateInput(dateStr))}
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              placeholder="From"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg text-base text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <CalendarIcon size={18} />
            </span>
          </div>
          <div className="relative w-full flatpickr-wrapper">
            <Flatpickr
              value={dateTo}
              onChange={(_, dateStr) => setDateTo(toDateInput(dateStr))}
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              placeholder="To"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg text-base text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <CalendarIcon size={18} />
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([
          { key: "paid", label: "Paid", count: statusCounts.paid },
          { key: "unpaid", label: "Unpaid", count: statusCounts.unpaid },
          { key: "draft", label: "Draft", count: statusCounts.draft },
          { key: "all", label: "All", count: statusCounts.all },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatusFilter(item.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              statusFilter === item.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-base bg-white dark:bg-gray-900">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Invoice
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Customer
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Branch
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Status
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Total
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Date
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No invoices found
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-gray-200">
                    {row.invoice_number || `INV-${row.id}`}
                  </td>
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    <div className="font-medium">
                      {row.customer ? `${row.customer.first_name} ${row.customer.last_name}` : "-"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {row.customer?.email || ""}
                    </div>
                  </td>
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    {row.branch?.name || "-"}
                  </td>
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                    {row.status}
                  </td>
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    ${Number(row.total || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    {formatDate(row.invoice_date)}
                  </td>
                  <td className="px-5 py-3 flex gap-2">
                    <Link
                      to={`/dashboard/invoices/${row.id}/preview`}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </Link>
                    {!row.locked_at && (
                      <Link
                        to={`/dashboard/invoices/${row.id}/edit`}
                        className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
