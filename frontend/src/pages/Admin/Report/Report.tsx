import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../api/axios";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ─── Inline Calendar Picker ───────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarPicker({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (val: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  const today = new Date();
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 p-3 w-64 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = fmt(new Date(viewYear, viewMonth, day));
          const isSelected = dateStr === value;
          const isToday = dateStr === fmt(today);
          const disabled =
            (minDate ? dateStr < minDate : false) ||
            (maxDate ? dateStr > maxDate : false);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              className={`
                h-8 w-full rounded-lg text-xs font-medium transition
                ${disabled ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "cursor-pointer"}
                ${isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : isToday && !disabled
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                  : !disabled
                  ? "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Date Input with Popover Calendar ─────────────────────────────────────────

function DateInput({
  label,
  value,
  onChange,
  minDate,
  maxDate,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          flex items-center gap-2 h-10 px-3 pr-4 rounded-lg border text-sm transition
          ${value
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }
          hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      >
        <Calendar size={14} className={value ? "text-blue-500" : "text-gray-400"} />
        <span>{displayValue}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
            className="ml-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 top-full left-0">
          <CalendarPicker
            value={value}
            onChange={(val) => { onChange(val); setOpen(false); }}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  );
}

interface BranchOption {
  id: number;
  name: string;
}

interface BranchBreakdownRow {
  branch_id: number | null;
  branch_name: string;
  approved_invoice_count: number;
  total_cash_inflow: number;
  total_item_price: number;
}

interface ContractSalesRow {
  contract_id: number | null;
  contract_name: string;
  count: number;
  total_sale: number;
}

interface ItemSalesRow {
  contract_id: number | null;
  contract_name: string;
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

interface SalesPersonServiceRow {
  sales_person_id: number | null;
  sales_person_name: string;
  item_name: string;
  sold_count: number;
  total_sale: number;
}

interface AssistantSalesPersonServiceRow {
  assistant_sales_person_id: number | null;
  assistant_sales_person_name: string;
  item_name: string;
  sold_count: number;
  total_sale: number;
}

interface ReportResponse {
  filters: {
    branches: BranchOption[];
    date_range: { from: string | null; to: string | null };
  };
  branch_breakdown: BranchBreakdownRow[];
  sales_person_breakdown: SalesPersonBreakdownRow[];
  assistant_sales_person_breakdown: AssistantSalesPersonBreakdownRow[];
  contract_sales: ContractSalesRow[];
  item_sales: ItemSalesRow[];
  top_items: ItemSalesRow[];
  sales_person_service_breakdown?: SalesPersonServiceRow[];
  assistant_sales_person_service_breakdown?: AssistantSalesPersonServiceRow[];
}

const formatCurrency = (value?: number) => `$${Number(value || 0).toFixed(2)}`;

const getThisMonthDates = (): { from: string; to: string } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: fmt(start), to: fmt(now) };
};

type TabKey = "summary" | "details" | "sales_person";

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [contractSales, setContractSales] = useState<ContractSalesRow[]>([]);
  const [itemSales, setItemSales] = useState<ItemSalesRow[]>([]);
  const [salesPersonServiceBreakdown, setSalesPersonServiceBreakdown] = useState<SalesPersonServiceRow[]>([]);
  const [assistantSalesPersonServiceBreakdown, setAssistantSalesPersonServiceBreakdown] = useState<AssistantSalesPersonServiceRow[]>([]);

  const [dateFrom, setDateFrom] = useState(() => getThisMonthDates().from);
  const [dateTo, setDateTo] = useState(() => getThisMonthDates().to);
  const [pendingFrom, setPendingFrom] = useState(dateFrom);
  const [pendingTo, setPendingTo] = useState(dateTo);

  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await api.get<ReportResponse>("/invoice-report", { params });
      const payload = res.data;

      setBranches(payload.filters?.branches || []);
      setContractSales(payload.contract_sales || []);
      setItemSales(payload.item_sales || []);
      setSalesPersonServiceBreakdown(payload.sales_person_service_breakdown || []);
      setAssistantSalesPersonServiceBreakdown(payload.assistant_sales_person_service_breakdown || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to load invoice report");
    } finally {
      setLoading(false);
    }
  }, [branchId, dateFrom, dateTo]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleApply = () => {
    setDateFrom(pendingFrom);
    setDateTo(pendingTo);
  };

  // Summary tab: contract-wise count
  const summaryRows = contractSales;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "details", label: "Details" },
    { key: "sales_person", label: "Sales Person" },
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 dark:bg-gray-900 bg-white relative w-full max-w-[1280px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Invoice Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Approved invoices only.</p>
        </div>
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

      {/* ── Date Filter Bar ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-5 py-4 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <DateInput
            label="Start date"
            value={pendingFrom}
            onChange={setPendingFrom}
            maxDate={pendingTo || undefined}
          />

          <span className="text-gray-400 text-sm font-medium">→</span>

          <DateInput
            label="End date"
            value={pendingTo}
            onChange={setPendingTo}
            minDate={pendingFrom || undefined}
          />

          <button
            type="button"
            onClick={handleApply}
            disabled={!pendingFrom || !pendingTo}
            className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Apply
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex justify-center mb-5">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
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
      </div>

      {/* ══ TAB: SUMMARY ══ */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : summaryRows.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">No data found for this period.</div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Contract Name</th>
                    <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Sales Count</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total Sale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {summaryRows.map((row) => (
                    <tr key={`${row.contract_id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200 font-medium">{row.contract_name}</td>
                      <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300">{row.count}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_sale)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                    <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                    <td className="px-5 py-3 text-center font-bold text-gray-900 dark:text-gray-100">{summaryRows.reduce((s, r) => s + r.count, 0)}</td>
                    <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(summaryRows.reduce((s, r) => s + r.total_sale, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: DETAILS ══ */}
{activeTab === "details" && (
  <div className="space-y-6">
    {loading ? (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading...</div>
    ) : itemSales.length === 0 ? (
      <div className="py-16 text-center text-gray-500 dark:text-gray-400">No data found.</div>
    ) : (() => {
        const grouped = Object.entries(
          itemSales.reduce<Record<string, { contract_name: string; items: ItemSalesRow[] }>>(
            (acc, row) => {
              const key = String(row.contract_id ?? 0);
              if (!acc[key]) acc[key] = { contract_name: row.contract_name, items: [] };
              acc[key].items.push(row);
              return acc;
            },
            {}
          )
        );

        const grandTotalSold = itemSales.reduce((s, r) => s + r.sold_count, 0);
        const grandTotalSale = itemSales.reduce((s, r) => s + r.total_item_price, 0);

        return (
          <>
            {grouped.map(([key, { contract_name, items }]) => (
              <div key={key} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{contract_name}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="min-w-[240px] px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Service</th>
                        {branchId && (
                          <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Branch</th>
                        )}
                        <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Sales count</th>
                        <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-300">`</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Total Sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {items.map((row) => (
                        <tr key={`${row.service_id}-${row.item_name}-${row.branch_id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                          <td className="min-w-[240px] px-5 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-normal break-words">{row.item_name}</td>
                          {branchId && (
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{row.branch_name}</td>
                          )}
                          <td className="px-5 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{row.sold_count}</td>
                          <td className="px-5 py-3 text-center font-medium text-gray-700 dark:text-gray-300"></td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(row.total_item_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* ── Grand Total ── */}
            {/* <div className="rounded-2xl border border-blue-200 dark:border-blue-800 overflow-hidden">
              <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                <tbody>
                  <tr className="bg-blue-600 dark:bg-blue-700">
                    <td className="min-w-[320px] px-5 py-4 font-bold text-white text-base">Grand Total</td>
                    {branchId && <td />}
                    <td className="px-5 py-4 text-center font-bold text-white text-base">{grandTotalSold}</td>
                    <td className="px-5 py-4 text-right font-bold text-white text-base">{formatCurrency(grandTotalSale)}</td>
                  </tr>
                </tbody>
              </table>
            </div> */}
          </>
        );
      })()
    }
  </div>
)}

      {/* ══ TAB: SALES PERSON ══ */}
      {activeTab === "sales_person" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <>
              {/* Sales Person Wise Sale */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Sales Person Wise Sale</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Sales Person</th>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400 min-w-[220px]">Service Name</th>
                        <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-28 whitespace-nowrap">Sales Count</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {salesPersonServiceBreakdown.length > 0 ? (
                        salesPersonServiceBreakdown.map((row) => (
                          <tr key={`${row.sales_person_id}-${row.item_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                            <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.sales_person_name}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300 min-w-[220px]">{row.item_name}</td>
                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300 w-28">{row.sold_count}</td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(row.total_sale)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No salesperson data found</td></tr>
                      )}
                      {/* {salesPersonServiceBreakdown.length > 0 && (
                        <tr className="bg-blue-600 dark:bg-blue-700">
                          <td className="px-5 py-4 font-bold text-white" colSpan={2}>Grand Total</td>
                          <td className="px-5 py-4 text-center font-bold text-white w-28">
                            {salesPersonServiceBreakdown.reduce((s, r) => s + r.sold_count, 0)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-white whitespace-nowrap">
                            {formatCurrency(salesPersonServiceBreakdown.reduce((s, r) => s + r.total_sale, 0))}
                          </td>
                        </tr>
                      )} */}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assistant Sales Person Wise Sale */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Assistant Sales Person Wise Sale</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Assistant Sales Person</th>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400 min-w-[220px]">Service Name</th>
                        <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-28 whitespace-nowrap">Sales Count</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {assistantSalesPersonServiceBreakdown.length > 0 ? (
                        assistantSalesPersonServiceBreakdown.map((row) => (
                          <tr key={`${row.assistant_sales_person_id}-${row.item_name}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                            <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.assistant_sales_person_name}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300 min-w-[220px]">{row.item_name}</td>
                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300 w-28">{row.sold_count}</td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(row.total_sale)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No assistant salesperson data found</td></tr>
                      )}
                      {/* {assistantSalesPersonServiceBreakdown.length > 0 && (
                        <tr className="bg-blue-600 dark:bg-blue-700">
                          <td className="px-5 py-4 font-bold text-white" colSpan={2}>Grand Total</td>
                          <td className="px-5 py-4 text-center font-bold text-white w-28">
                            {assistantSalesPersonServiceBreakdown.reduce((s, r) => s + r.sold_count, 0)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-white whitespace-nowrap">
                            {formatCurrency(assistantSalesPersonServiceBreakdown.reduce((s, r) => s + r.total_sale, 0))}
                          </td>
                        </tr>
                      )} */}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}