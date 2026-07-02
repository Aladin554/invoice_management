import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
      <div className="flex items-center justify-between mb-2 px-1">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition">
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>
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
  label, value, onChange, minDate, maxDate,
}: {
  label: string; value: string; onChange: (val: string) => void; minDate?: string; maxDate?: string;
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

// Updated: contract_name replaces item_name for Service Group display
interface SalesPersonServiceRow {
  sales_person_id: number | null;
  sales_person_name: string;
  contract_id: number | null;
  contract_name: string;
  sold_count: number;
  total_sale: number;
}

interface AssistantSalesPersonServiceRow {
  assistant_sales_person_id: number | null;
  assistant_sales_person_name: string;
  contract_id: number | null;
  contract_name: string;
  sold_count: number;
  total_sale: number;
}

interface SalesPersonItemRow {
  sales_person_id: number | null;
  sales_person_name: string;
  contract_id: number | null;
  contract_name: string;
  service_id: number | null;
  item_name: string;
  sold_count: number;
  total_sale: number;
}

interface AssistantSalesPersonItemRow {
  assistant_sales_person_id: number | null;
  assistant_sales_person_name: string;
  contract_id: number | null;
  contract_name: string;
  service_id: number | null;
  item_name: string;
  sold_count: number;
  total_sale: number;
}

interface SalesPersonTransactionRow {
  invoice_id: number;
  receipt_number: string;
  invoice_date: string | null;
  customer_name: string;
  payment_method: string | null;
  sales_person_id: number | null;
  sales_person_name: string;
  contract_id: number | null;
  contract_name: string;
  service_id: number | null;
  item_name: string;
  line_total: number;
  invoice_total: number;
}

interface AssistantSalesPersonTransactionRow {
  invoice_id: number;
  receipt_number: string;
  invoice_date: string | null;
  customer_name: string;
  payment_method: string | null;
  assistant_sales_person_id: number | null;
  assistant_sales_person_name: string;
  contract_id: number | null;
  contract_name: string;
  service_id: number | null;
  item_name: string;
  line_total: number;
  invoice_total: number;
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
  sales_person_item_breakdown?: SalesPersonItemRow[];
  assistant_sales_person_item_breakdown?: AssistantSalesPersonItemRow[];
  sales_person_transactions?: SalesPersonTransactionRow[];
  assistant_sales_person_transactions?: AssistantSalesPersonTransactionRow[];
}

const formatCurrency = (value?: number) => `${Number(value || 0).toFixed(2)} BDT`;

const formatReportDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatPaymentMethodLabel = (value?: string | null) => {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

type TransactionTarget = {
  type: "sales_person" | "assistant_sales_person";
  level: "person" | "group" | "type";
  personId: number | null;
  personName: string;
  contractId?: number | null;
  contractName?: string;
  serviceId?: number | null;
  itemName?: string;
  title: string;
};

interface TransactionRow {
  key: string;
  invoice_id: number;
  receipt_number: string;
  invoice_date: string | null;
  customer_name: string;
  payment_method: string | null;
  item_name?: string;
  amount: number;
}

const getTransactionRows = (
  target: TransactionTarget,
  salesPersonTransactions: SalesPersonTransactionRow[],
  assistantSalesPersonTransactions: AssistantSalesPersonTransactionRow[],
): { rows: TransactionRow[]; showItemColumn: boolean; totalAmount: number } => {
  let rows: TransactionRow[] = [];

  if (target.type === "sales_person") {
    const matches = salesPersonTransactions.filter(
      (row) => (row.sales_person_id ?? null) === target.personId,
    );

    if (target.level === "person") {
      const seenInvoices = new Set<number>();
      rows = matches
        .filter((row) => {
          if (seenInvoices.has(row.invoice_id)) return false;
          seenInvoices.add(row.invoice_id);
          return true;
        })
        .map((row) => ({
          key: String(row.invoice_id),
          invoice_id: row.invoice_id,
          receipt_number: row.receipt_number,
          invoice_date: row.invoice_date,
          customer_name: row.customer_name,
          payment_method: row.payment_method,
          amount: row.invoice_total,
        }));
    } else {
      rows = matches
        .filter((row) => {
          if ((row.contract_id ?? null) !== target.contractId) return false;
          if (target.level === "type") {
            return (
              (row.service_id ?? null) === target.serviceId &&
              row.item_name === target.itemName
            );
          }
          return true;
        })
        .map((row, index) => ({
          key: `${row.invoice_id}-${row.service_id}-${index}`,
          invoice_id: row.invoice_id,
          receipt_number: row.receipt_number,
          invoice_date: row.invoice_date,
          customer_name: row.customer_name,
          payment_method: row.payment_method,
          item_name: row.item_name,
          amount: row.line_total,
        }));
    }
  } else {
    const matches = assistantSalesPersonTransactions.filter(
      (row) => (row.assistant_sales_person_id ?? null) === target.personId,
    );

    if (target.level === "person") {
      const seenInvoices = new Set<number>();
      rows = matches
        .filter((row) => {
          if (seenInvoices.has(row.invoice_id)) return false;
          seenInvoices.add(row.invoice_id);
          return true;
        })
        .map((row) => ({
          key: String(row.invoice_id),
          invoice_id: row.invoice_id,
          receipt_number: row.receipt_number,
          invoice_date: row.invoice_date,
          customer_name: row.customer_name,
          payment_method: row.payment_method,
          amount: row.invoice_total,
        }));
    } else {
      rows = matches
        .filter((row) => {
          if ((row.contract_id ?? null) !== target.contractId) return false;
          if (target.level === "type") {
            return (
              (row.service_id ?? null) === target.serviceId &&
              row.item_name === target.itemName
            );
          }
          return true;
        })
        .map((row, index) => ({
          key: `${row.invoice_id}-${row.service_id}-${index}`,
          invoice_id: row.invoice_id,
          receipt_number: row.receipt_number,
          invoice_date: row.invoice_date,
          customer_name: row.customer_name,
          payment_method: row.payment_method,
          item_name: row.item_name,
          amount: row.line_total,
        }));
    }
  }

  return {
    rows,
    showItemColumn: target.level === "group",
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
  };
};

function TransactionTable({
  rows,
  showItemColumn,
  totalAmount,
}: {
  rows: TransactionRow[];
  showItemColumn: boolean;
  totalAmount: number;
}) {
  return (
    <table className="min-w-full text-sm bg-white dark:bg-gray-900">
      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
        <tr>
          <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
          <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Receipt</th>
          <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Customer</th>
          {showItemColumn && (
            <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Service Type</th>
          )}
          <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Payment Method</th>
          <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.length > 0 ? (
          <>
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatReportDate(row.invoice_date)}</td>
                <td className="px-5 py-2.5 whitespace-nowrap">
                  <Link
                    to={`/dashboard/invoices/${row.invoice_id}/preview`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {row.receipt_number}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-gray-800 dark:text-gray-200">{row.customer_name}</td>
                {showItemColumn && (
                  <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300">{row.item_name}</td>
                )}
                <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatPaymentMethodLabel(row.payment_method)}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
              <td className="px-5 py-2.5 font-bold text-gray-900 dark:text-gray-100" colSpan={showItemColumn ? 5 : 4}>
                Total ({rows.length})
              </td>
              <td className="px-5 py-2.5 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalAmount)}</td>
            </tr>
          </>
        ) : (
          <tr>
            <td colSpan={showItemColumn ? 6 : 5} className="px-5 py-8 text-center text-gray-400">
              No receipts found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

type GroupPanelState =
  | { kind: "service_type"; contractId: number | null; contractName: string }
  | { kind: "transactions"; target: TransactionTarget }
  | null;

interface ContractRow {
  contract_id: number | null;
  contract_name: string;
  sold_count: number;
  total_sale: number;
}

interface ItemRow {
  contract_id: number | null;
  service_id: number | null;
  item_name: string;
  sold_count: number;
  total_sale: number;
}

function ServiceGroupBreakdownCard({
  personType,
  personId,
  personName,
  contractRows,
  itemRowsByPerson,
  groupPanel,
  setGroupPanel,
  salesPersonTransactions,
  assistantSalesPersonTransactions,
  onClose,
}: {
  personType: "sales_person" | "assistant_sales_person";
  personId: number | null;
  personName: string;
  contractRows: ContractRow[];
  itemRowsByPerson: ItemRow[];
  groupPanel: GroupPanelState;
  setGroupPanel: (value: GroupPanelState | ((prev: GroupPanelState) => GroupPanelState)) => void;
  salesPersonTransactions: SalesPersonTransactionRow[];
  assistantSalesPersonTransactions: AssistantSalesPersonTransactionRow[];
  onClose: () => void;
}) {
  const totalCount = contractRows.reduce((s, r) => s + r.sold_count, 0);
  const totalSale = contractRows.reduce((s, r) => s + r.total_sale, 0);

  const expandedGroup =
    groupPanel?.kind === "service_type"
      ? contractRows.find((row) => row.contract_id === groupPanel.contractId) || null
      : null;
  const expandedItemRows = expandedGroup
    ? itemRowsByPerson.filter((item) => (item.contract_id ?? null) === expandedGroup.contract_id)
    : [];
  const expandedItemCount = expandedItemRows.reduce((s, r) => s + r.sold_count, 0);
  const expandedItemSale = expandedItemRows.reduce((s, r) => s + r.total_sale, 0);

  const transactionsTarget = groupPanel?.kind === "transactions" ? groupPanel.target : null;
  const transactionData = transactionsTarget
    ? getTransactionRows(transactionsTarget, salesPersonTransactions, assistantSalesPersonTransactions)
    : null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {personName} — Service Group Breakdown
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
          <table className="min-w-full text-sm bg-white dark:bg-gray-900">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Service Group</th>
                <th className="px-5 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 w-28 whitespace-nowrap">Sales Count</th>
                <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {contractRows.length > 0 ? (
                <>
                  {contractRows.map((row) => {
                    const isExpanded = expandedGroup?.contract_id === row.contract_id;
                    const isShowingTransactions =
                      transactionsTarget?.level === "group" && transactionsTarget.contractId === row.contract_id;

                    return (
                      <tr
                        key={row.contract_id}
                        className={`transition ${isExpanded || isShowingTransactions ? "bg-blue-50/60 dark:bg-blue-900/15" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"}`}
                      >
                        <td className="px-5 py-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setGroupPanel((prev) =>
                                prev?.kind === "service_type" && prev.contractId === row.contract_id
                                  ? null
                                  : { kind: "service_type", contractId: row.contract_id, contractName: row.contract_name },
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ChevronRight
                              size={14}
                              className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                            {row.contract_name}
                          </button>
                        </td>
                        <td className="px-5 py-2.5 text-center w-28">
                          <button
                            type="button"
                            onClick={() =>
                              setGroupPanel((prev) =>
                                prev?.kind === "transactions" &&
                                prev.target.level === "group" &&
                                prev.target.contractId === row.contract_id
                                  ? null
                                  : {
                                      kind: "transactions",
                                      target: {
                                        type: personType,
                                        level: "group",
                                        personId,
                                        personName,
                                        contractId: row.contract_id,
                                        contractName: row.contract_name,
                                        title: `${personName} — ${row.contract_name}`,
                                      },
                                    },
                              )
                            }
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {row.sold_count}
                          </button>
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(row.total_sale)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                    <td className="px-5 py-2.5 font-bold text-gray-900 dark:text-gray-100">Total</td>
                    <td className="px-5 py-2.5 text-center font-bold text-gray-900 dark:text-gray-100">{totalCount}</td>
                    <td className="px-5 py-2.5 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalSale)}</td>
                  </tr>
                </>
              ) : (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">No details found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {expandedGroup && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {expandedGroup.contract_name} — Service Type Breakdown
                </h3>
                <button
                  type="button"
                  onClick={() => setGroupPanel(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm bg-white dark:bg-gray-900">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                    <tr>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Service Type</th>
                      <th className="px-5 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 w-28 whitespace-nowrap">Sales Count</th>
                      <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {expandedItemRows.length > 0 ? (
                      <>
                        {expandedItemRows.map((item) => (
                          <tr
                            key={`${item.service_id}-${item.item_name}`}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                          >
                            <td className="px-5 py-2.5 text-gray-800 dark:text-gray-200">{item.item_name}</td>
                            <td className="px-5 py-2.5 text-center w-28">
                              <button
                                type="button"
                                onClick={() =>
                                  setGroupPanel({
                                    kind: "transactions",
                                    target: {
                                      type: personType,
                                      level: "type",
                                      personId,
                                      personName,
                                      contractId: expandedGroup.contract_id,
                                      contractName: expandedGroup.contract_name,
                                      serviceId: item.service_id,
                                      itemName: item.item_name,
                                      title: `${personName} — ${expandedGroup.contract_name} — ${item.item_name}`,
                                    },
                                  })
                                }
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {item.sold_count}
                              </button>
                            </td>
                            <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(item.total_sale)}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                          <td className="px-5 py-2.5 font-bold text-gray-900 dark:text-gray-100">Total</td>
                          <td className="px-5 py-2.5 text-center font-bold text-gray-900 dark:text-gray-100">{expandedItemCount}</td>
                          <td className="px-5 py-2.5 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(expandedItemSale)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">No service type details found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {transactionData && transactionsTarget && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{transactionsTarget.title}</h3>
                <button
                  type="button"
                  onClick={() => setGroupPanel(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <TransactionTable
                  rows={transactionData.rows}
                  showItemColumn={transactionData.showItemColumn}
                  totalAmount={transactionData.totalAmount}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type TabKey = "summary" | "details" | "sales_person";

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [contractSales, setContractSales] = useState<ContractSalesRow[]>([]);
  const [itemSales, setItemSales] = useState<ItemSalesRow[]>([]);
  const [salesPersonBreakdown, setSalesPersonBreakdown] = useState<SalesPersonBreakdownRow[]>([]);
  const [assistantSalesPersonBreakdown, setAssistantSalesPersonBreakdown] = useState<AssistantSalesPersonBreakdownRow[]>([]);
  const [salesPersonServiceBreakdown, setSalesPersonServiceBreakdown] = useState<SalesPersonServiceRow[]>([]);
  const [assistantSalesPersonServiceBreakdown, setAssistantSalesPersonServiceBreakdown] = useState<AssistantSalesPersonServiceRow[]>([]);
  const [salesPersonItemBreakdown, setSalesPersonItemBreakdown] = useState<SalesPersonItemRow[]>([]);
  const [assistantSalesPersonItemBreakdown, setAssistantSalesPersonItemBreakdown] = useState<AssistantSalesPersonItemRow[]>([]);
  const [salesPersonTransactions, setSalesPersonTransactions] = useState<SalesPersonTransactionRow[]>([]);
  const [assistantSalesPersonTransactions, setAssistantSalesPersonTransactions] = useState<AssistantSalesPersonTransactionRow[]>([]);
  const [personPanel, setPersonPanel] = useState<
    | { kind: "service_group"; type: "sales_person" | "assistant_sales_person"; personId: number | null; personName: string }
    | { kind: "transactions"; target: TransactionTarget }
    | null
  >(null);
  const [groupPanel, setGroupPanel] = useState<GroupPanelState>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");

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
      setSalesPersonBreakdown(payload.sales_person_breakdown || []);
      setAssistantSalesPersonBreakdown(payload.assistant_sales_person_breakdown || []);
      setSalesPersonServiceBreakdown(payload.sales_person_service_breakdown || []);
      setAssistantSalesPersonServiceBreakdown(payload.assistant_sales_person_service_breakdown || []);
      setSalesPersonItemBreakdown(payload.sales_person_item_breakdown || []);
      setAssistantSalesPersonItemBreakdown(payload.assistant_sales_person_item_breakdown || []);
      setSalesPersonTransactions(payload.sales_person_transactions || []);
      setAssistantSalesPersonTransactions(payload.assistant_sales_person_transactions || []);
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
          <DateInput label="Start date" value={pendingFrom} onChange={setPendingFrom} maxDate={pendingTo || undefined} />
          <span className="text-gray-400 text-sm font-medium">→</span>
          <DateInput label="End date" value={pendingTo} onChange={setPendingTo} minDate={pendingFrom || undefined} />
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
                    <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Service Group</th>
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
                              <th className="min-w-[240px] px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Service Type</th>
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
                        <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-28 whitespace-nowrap">Sales Count</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {salesPersonBreakdown.length > 0 ? (
                        <>
                          {salesPersonBreakdown.map((row) => (
                            <tr key={`${row.sales_person_id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                              <td className="px-5 py-3 font-semibold whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupPanel(null);
                                    setPersonPanel((prev) =>
                                      prev?.kind === "service_group" &&
                                      prev.type === "sales_person" &&
                                      prev.personId === row.sales_person_id
                                        ? null
                                        : {
                                            kind: "service_group",
                                            type: "sales_person",
                                            personId: row.sales_person_id,
                                            personName: row.sales_person_name,
                                          },
                                    );
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {row.sales_person_name}
                                </button>
                              </td>
                              <td className="px-5 py-3 text-center w-28">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupPanel(null);
                                    setPersonPanel((prev) =>
                                      prev?.kind === "transactions" &&
                                      prev.target.type === "sales_person" &&
                                      prev.target.level === "person" &&
                                      prev.target.personId === row.sales_person_id
                                        ? null
                                        : {
                                            kind: "transactions",
                                            target: {
                                              type: "sales_person",
                                              level: "person",
                                              personId: row.sales_person_id,
                                              personName: row.sales_person_name,
                                              title: `${row.sales_person_name} — All Receipts`,
                                            },
                                          },
                                    );
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {row.approved_invoice_count}
                                </button>
                              </td>
                              <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(row.total_item_price)}</td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                            <td className="px-5 py-3 text-center font-bold text-gray-900 dark:text-gray-100">
                              {salesPersonBreakdown.reduce((s, r) => s + r.approved_invoice_count, 0)}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">
                              {formatCurrency(salesPersonBreakdown.reduce((s, r) => s + r.total_item_price, 0))}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr><td colSpan={3} className="px-5 py-12 text-center text-gray-400">No salesperson data found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {personPanel?.kind === "transactions" && personPanel.target.type === "sales_person" && (() => {
                  const { rows, showItemColumn, totalAmount } = getTransactionRows(
                    personPanel.target,
                    salesPersonTransactions,
                    assistantSalesPersonTransactions,
                  );

                  return (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4">
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{personPanel.target.title}</h3>
                          <button
                            type="button"
                            onClick={() => setPersonPanel(null)}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                          <TransactionTable rows={rows} showItemColumn={showItemColumn} totalAmount={totalAmount} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {personPanel?.kind === "service_group" && personPanel.type === "sales_person" && (
                  <ServiceGroupBreakdownCard
                    personType="sales_person"
                    personId={personPanel.personId}
                    personName={personPanel.personName}
                    contractRows={salesPersonServiceBreakdown
                      .filter((row) => (row.sales_person_id ?? null) === personPanel.personId)
                      .map((row) => ({
                        contract_id: row.contract_id,
                        contract_name: row.contract_name,
                        sold_count: row.sold_count,
                        total_sale: row.total_sale,
                      }))}
                    itemRowsByPerson={salesPersonItemBreakdown
                      .filter((row) => (row.sales_person_id ?? null) === personPanel.personId)
                      .map((row) => ({
                        contract_id: row.contract_id,
                        service_id: row.service_id,
                        item_name: row.item_name,
                        sold_count: row.sold_count,
                        total_sale: row.total_sale,
                      }))}
                    groupPanel={groupPanel}
                    setGroupPanel={setGroupPanel}
                    salesPersonTransactions={salesPersonTransactions}
                    assistantSalesPersonTransactions={assistantSalesPersonTransactions}
                    onClose={() => {
                      setPersonPanel(null);
                      setGroupPanel(null);
                    }}
                  />
                )}
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
                        <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-28 whitespace-nowrap">Sales Count</th>
                        <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Total Sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {assistantSalesPersonBreakdown.length > 0 ? (
                        <>
                          {assistantSalesPersonBreakdown.map((row) => (
                            <tr key={`${row.assistant_sales_person_id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                              <td className="px-5 py-3 font-semibold whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupPanel(null);
                                    setPersonPanel((prev) =>
                                      prev?.kind === "service_group" &&
                                      prev.type === "assistant_sales_person" &&
                                      prev.personId === row.assistant_sales_person_id
                                        ? null
                                        : {
                                            kind: "service_group",
                                            type: "assistant_sales_person",
                                            personId: row.assistant_sales_person_id,
                                            personName: row.assistant_sales_person_name,
                                          },
                                    );
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {row.assistant_sales_person_name}
                                </button>
                              </td>
                              <td className="px-5 py-3 text-center w-28">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupPanel(null);
                                    setPersonPanel((prev) =>
                                      prev?.kind === "transactions" &&
                                      prev.target.type === "assistant_sales_person" &&
                                      prev.target.level === "person" &&
                                      prev.target.personId === row.assistant_sales_person_id
                                        ? null
                                        : {
                                            kind: "transactions",
                                            target: {
                                              type: "assistant_sales_person",
                                              level: "person",
                                              personId: row.assistant_sales_person_id,
                                              personName: row.assistant_sales_person_name,
                                              title: `${row.assistant_sales_person_name} — All Receipts`,
                                            },
                                          },
                                    );
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {row.approved_invoice_count}
                                </button>
                              </td>
                              <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(row.total_item_price)}</td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-800">
                            <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                            <td className="px-5 py-3 text-center font-bold text-gray-900 dark:text-gray-100">
                              {assistantSalesPersonBreakdown.reduce((s, r) => s + r.approved_invoice_count, 0)}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-blue-700 dark:text-blue-300">
                              {formatCurrency(assistantSalesPersonBreakdown.reduce((s, r) => s + r.total_item_price, 0))}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr><td colSpan={3} className="px-5 py-12 text-center text-gray-400">No assistant salesperson data found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {personPanel?.kind === "transactions" && personPanel.target.type === "assistant_sales_person" && (() => {
                  const { rows, showItemColumn, totalAmount } = getTransactionRows(
                    personPanel.target,
                    salesPersonTransactions,
                    assistantSalesPersonTransactions,
                  );

                  return (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4">
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{personPanel.target.title}</h3>
                          <button
                            type="button"
                            onClick={() => setPersonPanel(null)}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                          <TransactionTable rows={rows} showItemColumn={showItemColumn} totalAmount={totalAmount} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {personPanel?.kind === "service_group" && personPanel.type === "assistant_sales_person" && (
                  <ServiceGroupBreakdownCard
                    personType="assistant_sales_person"
                    personId={personPanel.personId}
                    personName={personPanel.personName}
                    contractRows={assistantSalesPersonServiceBreakdown
                      .filter((row) => (row.assistant_sales_person_id ?? null) === personPanel.personId)
                      .map((row) => ({
                        contract_id: row.contract_id,
                        contract_name: row.contract_name,
                        sold_count: row.sold_count,
                        total_sale: row.total_sale,
                      }))}
                    itemRowsByPerson={assistantSalesPersonItemBreakdown
                      .filter((row) => (row.assistant_sales_person_id ?? null) === personPanel.personId)
                      .map((row) => ({
                        contract_id: row.contract_id,
                        service_id: row.service_id,
                        item_name: row.item_name,
                        sold_count: row.sold_count,
                        total_sale: row.total_sale,
                      }))}
                    groupPanel={groupPanel}
                    setGroupPanel={setGroupPanel}
                    salesPersonTransactions={salesPersonTransactions}
                    assistantSalesPersonTransactions={assistantSalesPersonTransactions}
                    onClose={() => {
                      setPersonPanel(null);
                      setGroupPanel(null);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}