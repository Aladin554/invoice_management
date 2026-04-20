import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Building2, DollarSign, FileCheck2, RotateCcw, Calendar, ChevronDown } from "lucide-react";
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
    date_range: { from: string | null; to: string | null };
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

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
  { label: "Custom", value: "custom" },
];

const getPresetDates = (preset: string): { from: string; to: string } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const startOf = (d: Date, unit: "week" | "month" | "year") => {
    const r = new Date(d);
    if (unit === "week") { r.setDate(d.getDate() - d.getDay()); }
    if (unit === "month") { r.setDate(1); }
    if (unit === "year") { r.setMonth(0, 1); }
    return r;
  };
  switch (preset) {
    case "today": return { from: fmt(now), to: fmt(now) };
    case "this_week": return { from: fmt(startOf(now, "week")), to: fmt(now) };
    case "this_month": return { from: fmt(startOf(now, "month")), to: fmt(now) };
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(s), to: fmt(e) };
    }
    case "this_year": return { from: fmt(startOf(now, "year")), to: fmt(now) };
    default: return { from: fmt(now), to: fmt(now) };
  }
};

type TabKey = "summary" | "details" | "sales_person";

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [branchBreakdown, setBranchBreakdown] = useState<BranchBreakdownRow[]>([]);
  const [salesPersonBreakdown, setSalesPersonBreakdown] = useState<SalesPersonBreakdownRow[]>([]);
  const [assistantSalesPersonBreakdown, setAssistantSalesPersonBreakdown] = useState<AssistantSalesPersonBreakdownRow[]>([]);
  const [itemSales, setItemSales] = useState<ItemSalesRow[]>([]);

  // Date filter
  const [datePreset, setDatePreset] = useState("this_month");
  const [dateFrom, setDateFrom] = useState(() => getPresetDates("this_month").from);
  const [dateTo, setDateTo] = useState(() => getPresetDates("this_month").to);
  const [pendingFrom, setPendingFrom] = useState(dateFrom);
  const [pendingTo, setPendingTo] = useState(dateTo);
  const [pendingPreset, setPendingPreset] = useState("this_month");
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  useEffect(() => {
    void fetchReport();
  }, [branchId, dateFrom, dateTo]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get<ReportResponse>("/invoice-report", { params });
      const payload = res.data;

      setBranches(payload.filters?.branches || []);
      setSummary(payload.summary || emptySummary);
      setBranchBreakdown(payload.branch_breakdown || []);
      setSalesPersonBreakdown(payload.sales_person_breakdown || []);
      setAssistantSalesPersonBreakdown(payload.assistant_sales_person_breakdown || []);
      setItemSales(payload.item_sales || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice report");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setPendingPreset(preset);
    if (preset !== "custom") {
      const { from, to } = getPresetDates(preset);
      setPendingFrom(from);
      setPendingTo(to);
    }
    setShowPresetDropdown(false);
  };

  const handleUpdateReport = () => {
    setDatePreset(pendingPreset);
    setDateFrom(pendingFrom);
    setDateTo(pendingTo);
  };

  const handleReset = () => {
    const preset = "this_month";
    const { from, to } = getPresetDates(preset);
    setDatePreset(preset);
    setPendingPreset(preset);
    setDateFrom(from);
    setDateTo(to);
    setPendingFrom(from);
    setPendingTo(to);
    setBranchId("");
  };

  // Group itemSales by branch for Summary tab
  const itemSalesByBranch = itemSales.reduce<Record<string, { branch_name: string; items: ItemSalesRow[] }>>(
    (acc, row) => {
      const key = String(row.branch_id ?? "none");
      if (!acc[key]) acc[key] = { branch_name: row.branch_name, items: [] };
      acc[key].items.push(row);
      return acc;
    },
    {}
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "details", label: "Details" },
    { key: "sales_person", label: "Sales Person" },
  ];

  const selectedPresetLabel = DATE_PRESETS.find((p) => p.value === pendingPreset)?.label || "Custom";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 dark:bg-gray-900 bg-white relative w-full max-w-[1280px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Invoice Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Approved invoices only.</p>
        </div>

        {/* Branch filter */}
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* ── Date Filter Bar (Cash Flow style) ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-5 py-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">Date Range</span>

          {/* Preset dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetDropdown((v) => !v)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {selectedPresetLabel}
              <ChevronDown size={14} />
            </button>
            {showPresetDropdown && (
              <div className="absolute top-full left-0 mt-1 z-20 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePresetSelect(p.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      pendingPreset === p.value
                        ? "font-semibold text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* From date */}
          <div className="relative">
            <input
              type="date"
              value={pendingFrom}
              onChange={(e) => { setPendingFrom(e.target.value); setPendingPreset("custom"); }}
              className="h-9 pl-3 pr-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <span className="text-gray-400 text-sm">to</span>

          {/* To date */}
          <div className="relative">
            <input
              type="date"
              value={pendingTo}
              onChange={(e) => { setPendingTo(e.target.value); setPendingPreset("custom"); }}
              className="h-9 pl-3 pr-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Update Report */}
          <button
            type="button"
            onClick={handleUpdateReport}
            className="h-9 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Update Report
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Cash Inflow", value: formatCurrency(summary.total_cash_inflow), icon: <DollarSign size={18} />, color: "blue" },
          { label: "Total Item Price", value: formatCurrency(summary.total_item_price), icon: <Building2 size={18} />, color: "violet" },
          { label: "Approved Invoices", value: String(summary.approved_invoice_count), icon: <FileCheck2 size={18} />, color: "emerald" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
              <div className={`p-2 rounded-lg ${
                card.color === "blue" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : card.color === "violet" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              }`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TAB: SUMMARY
          Service name | sold count | price per branch
      ══════════════════════════════════ */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : Object.keys(itemSalesByBranch).length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">No data found for this period.</div>
          ) : (
            <>
              {Object.entries(itemSalesByBranch).map(([key, { branch_name, items }]) => {
                const branchTotal = items.reduce((s, r) => s + r.total_item_price, 0);
                const branchSold = items.reduce((s, r) => s + r.sold_count, 0);
                return (
                  <div key={key} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Branch header */}
                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Building2 size={15} className="text-blue-500" />
                        {branch_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{branchSold} sold</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(branchTotal)}</span>
                      </div>
                    </div>

                    {/* Service rows */}
                    <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                      <thead className="bg-gray-50/60 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Service Name</th>
                          <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Sales Count</th>
                          <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {items.map((row) => (
                          <tr key={`${row.service_id}-${row.item_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                            <td className="px-5 py-3 text-gray-800 dark:text-gray-200 font-medium">{row.item_name}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.sold_count}</td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_item_price)}</td>
                          </tr>
                        ))}
                        {/* Branch total row */}
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                          <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                          <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{branchSold}</td>
                          <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(branchTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Grand total */}
              <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-base">Grand Total</span>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {itemSales.reduce((s, r) => s + r.sold_count, 0)} total sold
                  </span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(itemSales.reduce((s, r) => s + r.total_item_price, 0))}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          TAB: DETAILS
          Branch breakdown table (contract/service wise)
      ══════════════════════════════════ */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : branchBreakdown.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">No branch data found.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Branch-wise Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Branch</th>
                        <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Approved Invoices</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Item Price</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Cash Inflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {branchBreakdown.map((row) => (
                        <tr key={`${row.branch_id ?? "none"}-${row.branch_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.branch_name}</td>
                          <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.approved_invoice_count}</td>
                          <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(row.total_item_price)}</td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_cash_inflow)}</td>
                        </tr>
                      ))}
                      {/* Totals */}
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">
                          {branchBreakdown.reduce((s, r) => s + r.approved_invoice_count, 0)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(branchBreakdown.reduce((s, r) => s + r.total_item_price, 0))}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(branchBreakdown.reduce((s, r) => s + r.total_cash_inflow, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Service wise inside details */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Service-wise Sales</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Service</th>
                        <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Branch</th>
                        <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sold</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {loading ? (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">Loading...</td></tr>
                      ) : itemSales.length === 0 ? (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No item sales found</td></tr>
                      ) : (
                        itemSales.map((row) => (
                          <tr key={`${row.branch_id}-${row.service_id}-${row.item_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.item_name}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.branch_name}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.sold_count}</td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_item_price)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          TAB: SALES PERSON
          Sales person + assistant breakdown
      ══════════════════════════════════ */}
      {activeTab === "sales_person" && (
        <div className="space-y-6">
          {/* Sales Person table */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Sales Person Wise Sale</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sales Person</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Approved</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Item Price</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Cash Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">Loading...</td></tr>
                  ) : salesPersonBreakdown.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No salesperson data found</td></tr>
                  ) : (
                    <>
                      {salesPersonBreakdown.map((row) => (
                        <tr key={`${row.sales_person_id ?? "none"}-${row.sales_person_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.sales_person_name}</td>
                          <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.approved_invoice_count}</td>
                          <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(row.total_item_price)}</td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_cash_inflow)}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">
                          {salesPersonBreakdown.reduce((s, r) => s + r.approved_invoice_count, 0)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(salesPersonBreakdown.reduce((s, r) => s + r.total_item_price, 0))}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(salesPersonBreakdown.reduce((s, r) => s + r.total_cash_inflow, 0))}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assistant Sales Person table */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Assistant Sales Person Wise Sale</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Assistant Sales Person</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Approved</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Item Price</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Cash Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">Loading...</td></tr>
                  ) : assistantSalesPersonBreakdown.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No assistant salesperson data found</td></tr>
                  ) : (
                    <>
                      {assistantSalesPersonBreakdown.map((row) => (
                        <tr key={`${row.assistant_sales_person_id ?? "none"}-${row.assistant_sales_person_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.assistant_sales_person_name}</td>
                          <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.approved_invoice_count}</td>
                          <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(row.total_item_price)}</td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_cash_inflow)}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">
                          {assistantSalesPersonBreakdown.reduce((s, r) => s + r.approved_invoice_count, 0)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(assistantSalesPersonBreakdown.reduce((s, r) => s + r.total_item_price, 0))}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(assistantSalesPersonBreakdown.reduce((s, r) => s + r.total_cash_inflow, 0))}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}