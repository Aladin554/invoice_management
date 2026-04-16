import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Building2, DollarSign, FileCheck2, RotateCcw } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface BranchOption {
  id: number;
  name: string;
}

interface ReportSummary {
  approved_invoice_count: number;
  total_cash_inflow: number;
  total_item_price: number;
}

interface BranchBreakdownRow {
  branch_id: number | null;
  branch_name: string;
  approved_invoice_count: number;
  total_cash_inflow: number;
  total_item_price: number;
}

interface ItemSalesRow {
  service_id: number | null;
  item_name: string;
  branch_id: number | null;
  branch_name: string;
  sold_count: number;
  total_item_price: number;
}

interface SalesPersonBreakdownRow {
  sales_person_id: number | null;
  sales_person_name: string;
  approved_invoice_count: number;
  total_cash_inflow: number;
  total_item_price: number;
}

interface AssistantSalesPersonBreakdownRow {
  assistant_sales_person_id: number | null;
  assistant_sales_person_name: string;
  approved_invoice_count: number;
  total_cash_inflow: number;
  total_item_price: number;
}

interface ReportResponse {
  filters: {
    branches: BranchOption[];
    date_range: {
      from: string | null;
      to: string | null;
    };
  };
  summary: ReportSummary;
  branch_breakdown: BranchBreakdownRow[];
  sales_person_breakdown: SalesPersonBreakdownRow[];
  assistant_sales_person_breakdown: AssistantSalesPersonBreakdownRow[];
  item_sales: ItemSalesRow[];
  top_items: ItemSalesRow[];
}

const emptySummary: ReportSummary = {
  approved_invoice_count: 0,
  total_cash_inflow: 0,
  total_item_price: 0,
};

const formatCurrency = (value?: number) => `$${Number(value || 0).toFixed(2)}`;

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [branchBreakdown, setBranchBreakdown] = useState<BranchBreakdownRow[]>([]);
  const [salesPersonBreakdown, setSalesPersonBreakdown] = useState<SalesPersonBreakdownRow[]>([]);
  const [assistantSalesPersonBreakdown, setAssistantSalesPersonBreakdown] = useState<
    AssistantSalesPersonBreakdownRow[]
  >([]);
  const [itemSales, setItemSales] = useState<ItemSalesRow[]>([]);
  const [topItems, setTopItems] = useState<ItemSalesRow[]>([]);

  useEffect(() => {
    void fetchReport();
  }, [branchId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = branchId ? { branch_id: branchId } : undefined;
      const res = await api.get<ReportResponse>("/invoice-report", { params });
      const payload = res.data;

      setBranches(payload.filters?.branches || []);
      setSummary(payload.summary || emptySummary);
      setBranchBreakdown(payload.branch_breakdown || []);
      setSalesPersonBreakdown(payload.sales_person_breakdown || []);
      setAssistantSalesPersonBreakdown(payload.assistant_sales_person_breakdown || []);
      setItemSales(payload.item_sales || []);
      setTopItems(payload.top_items || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice report");
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    {
      label: "Total Cash Inflow",
      value: formatCurrency(summary.total_cash_inflow),
      icon: <DollarSign size={18} />,
    },
    {
      label: "Total Item Price",
      value: formatCurrency(summary.total_item_price),
      icon: <Building2 size={18} />,
    },
    {
      label: "Approved Invoices",
      value: String(summary.approved_invoice_count),
      icon: <FileCheck2 size={18} />,
    },
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 dark:bg-gray-900 bg-white relative w-full max-w-[1280px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Invoice Report
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Approved invoices only. Cash inflow comes from approved totals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-base text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[240px]"
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setBranchId("")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Branch Summary</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-base bg-white dark:bg-gray-900">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Branch</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Approved</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Item Price</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Cash Inflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : branchBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                      No approved invoice data found
                    </td>
                  </tr>
                ) : (
                  branchBreakdown.map((row) => (
                    <tr key={`${row.branch_id ?? "none"}-${row.branch_name}`}>
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{row.branch_name}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{row.approved_invoice_count}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(row.total_item_price)}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(row.total_cash_inflow)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Top Items</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : topItems.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">No item sales found</div>
            ) : (
              topItems.map((item) => (
                <div
                  key={`${item.branch_id ?? "none"}-${item.service_id ?? "none"}-${item.item_name}`}
                  className="px-5 py-4"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.item_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.branch_name}</div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sold: {item.sold_count}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.total_item_price)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Sales Person Wise Sale</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-base bg-white dark:bg-gray-900">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Sales Person
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Approved</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Item Price</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Cash Inflow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : salesPersonBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                      No salesperson data found
                    </td>
                  </tr>
                ) : (
                  salesPersonBreakdown.map((row) => (
                    <tr key={`${row.sales_person_id ?? "none"}-${row.sales_person_name}`}>
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{row.sales_person_name}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {row.approved_invoice_count}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.total_item_price)}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.total_cash_inflow)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Assistant Sales Person Wise Sale
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-base bg-white dark:bg-gray-900">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Assistant Sales Person
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Approved</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Item Price</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Cash Inflow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : assistantSalesPersonBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                      No assistant salesperson data found
                    </td>
                  </tr>
                ) : (
                  assistantSalesPersonBreakdown.map((row) => (
                    <tr
                      key={`${row.assistant_sales_person_id ?? "none"}-${row.assistant_sales_person_name}`}
                    >
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200">
                        {row.assistant_sales_person_name}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {row.approved_invoice_count}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.total_item_price)}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.total_cash_inflow)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Item Wise Sale</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-base bg-white dark:bg-gray-900">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Item</th>
                <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Branch</th>
                <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Sold Count</th>
                <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Total Item Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : itemSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                    No item sales found
                  </td>
                </tr>
              ) : (
                itemSales.map((row) => (
                  <tr key={`${row.branch_id ?? "none"}-${row.service_id ?? "none"}-${row.item_name}`}>
                    <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{row.item_name}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{row.branch_name}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{row.sold_count}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {formatCurrency(row.total_item_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
