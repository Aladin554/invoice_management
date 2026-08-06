import { useEffect, useState } from "react";
import { Wallet, Clock, Banknote, XCircle, Eye, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axios";
import { DateRangeFilterBar, PillTabs } from "../../components/common/DateRangePicker";
import ExpenseCardDetailModal from "./ExpenseCardDetailModal";
import ExpenseRequestDetailModal from "./ExpenseRequestDetailModal";
import { ExpenseStatus, PaymentRequestItem } from "./types";

const truncateWords = (text: string, wordLimit = 6) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return `${words.slice(0, wordLimit).join(" ")}…`;
};

function PurposeTextModal({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Purpose</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{text}</p>
      </div>
    </div>
  );
}

type StatusCountKey =
  | "submitted"
  | "finance_approved"
  | "money_provided"
  | "finance_rejected"
  | "owner_rejected"
  | "payment_rejected"
  | "paid";

const STATUS_CARDS: {
  key: StatusCountKey;
  title: string;
  status: ExpenseStatus;
  allowOwnerReview?: boolean;
  icon: typeof Clock;
  accent: "amber" | "blue" | "violet" | "rose" | "emerald";
}[] = [
  { key: "submitted", title: "Pending Finance Review", status: "submitted", icon: Clock, accent: "amber" },
  {
    key: "finance_approved",
    title: "Pending Owner Approval",
    status: "finance_approved",
    allowOwnerReview: true,
    icon: Clock,
    accent: "blue",
  },
  { key: "money_provided", title: "Awaiting Settlement", status: "money_provided", icon: Banknote, accent: "violet" },
  { key: "finance_rejected", title: "Rejected by Finance", status: "finance_rejected", icon: XCircle, accent: "rose" },
  { key: "owner_rejected", title: "Rejected by Owner", status: "owner_rejected", icon: XCircle, accent: "rose" },
  {
    key: "payment_rejected",
    title: "Cancelled by Finance",
    status: "payment_rejected",
    icon: XCircle,
    accent: "rose",
  },
];

const ACCENT_CLASSES: Record<string, { icon: string; hover: string }> = {
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    hover: "hover:border-amber-300 dark:hover:border-amber-700",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    hover: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    hover: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    hover: "hover:border-rose-300 dark:hover:border-rose-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    hover: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
};

type Period = "daily" | "monthly" | "yearly";
type DetailTab = "recent" | "period" | "category";

interface SummaryPoint {
  label: string;
  total: string;
}

interface CategoryPoint {
  category: string;
  total: string;
}

interface RecentTransaction {
  id: number;
  payment_request_id: number;
  amount_paid: string;
  payment_method: string;
  payment_date: string;
  payment_request: {
    purpose?: string | null;
    employee?: { first_name: string; last_name: string } | null;
    category?: { name: string } | null;
  } | null;
}

interface ReportData {
  total_expenses: string;
  status_counts: Record<StatusCountKey, number>;
  period: Period;
  summary: SummaryPoint[];
  category_wise: CategoryPoint[];
  recent_transactions: RecentTransaction[];
}

const formatMoney = (value: string | number) => `${Number(value || 0).toFixed(2)} BDT`;

const formatSummaryLabel = (label: string, period: Period) => {
  if (period === "yearly") return label;
  if (period === "daily") {
    return new Date(label + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  const [year, month] = label.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: "recent", label: "Recent Transactions" },
  { key: "period", label: "By Period" },
  { key: "category", label: "By Category" },
];

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function ExpenseReport() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [activeTab, setActiveTab] = useState<DetailTab>("recent");
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailCard, setDetailCard] = useState<{
    title: string;
    status: ExpenseStatus;
    allowOwnerReview?: boolean;
  } | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PaymentRequestItem | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [viewingPurpose, setViewingPurpose] = useState<string | null>(null);

  const handleView = async (paymentRequestId: number) => {
    setViewingId(paymentRequestId);
    try {
      const res = await api.get<PaymentRequestItem>(`/expense/requests/${paymentRequestId}`);
      setViewingRequest(res.data);
    } catch {
      toast.error("Failed to load request details");
    } finally {
      setViewingId(null);
    }
  };

  const handleApply = () => {
    setDateFrom(pendingFrom);
    setDateTo(pendingTo);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get<ReportData>("/expense/report", {
        params: { period, date_from: dateFrom || undefined, date_to: dateTo || undefined },
      })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load expense report"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFrom, dateTo]);

  if (loading && !data) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <DateRangeFilterBar
        pendingFrom={pendingFrom}
        pendingTo={pendingTo}
        onFromChange={setPendingFrom}
        onToChange={setPendingTo}
        onApply={handleApply}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setDetailCard({ title: "Paid Expenses", status: "paid" })}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-blue-700"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Wallet size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">Total Expenses (Paid)</div>
              <div className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(data?.total_expenses ?? 0)}
              </div>
            </div>
          </div>
        </button>

        {STATUS_CARDS.map((card) => {
          const Icon = card.icon;
          const accent = ACCENT_CLASSES[card.accent];
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                setDetailCard({ title: card.title, status: card.status, allowOwnerReview: card.allowOwnerReview })
              }
              className={`rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 ${accent.hover}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{card.title}</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {data?.status_counts?.[card.key] ?? 0}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <PillTabs tabs={DETAIL_TABS} active={activeTab} onChange={setActiveTab} />

          {activeTab === "period" && (
            <PillTabs tabs={PERIOD_OPTIONS} active={period} onChange={setPeriod} />
          )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === "recent" && (
            <table className="min-w-full bg-white text-sm dark:bg-slate-950/80">
              <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Purpose</th>
                  <th className="px-5 py-3.5">Amount Paid</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(data?.recent_transactions ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  data!.recent_transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                      <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100">
                        {tx.payment_request?.employee
                          ? `${tx.payment_request.employee.first_name} ${tx.payment_request.employee.last_name}`
                          : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                        {tx.payment_request?.category?.name || "-"}
                      </td>
                      <td className="px-5 py-3.5 max-w-[240px] text-slate-600 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => setViewingPurpose(tx.payment_request?.purpose || "-")}
                          className="text-left transition hover:text-blue-600 dark:hover:text-blue-400"
                          title="Click to view full purpose"
                        >
                          {truncateWords(tx.payment_request?.purpose || "-")}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {formatMoney(tx.amount_paid)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{tx.payment_date}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 capitalize">{tx.payment_method}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleView(tx.payment_request_id)}
                          disabled={viewingId === tx.payment_request_id}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "period" && (
            <table className="min-w-full bg-white text-sm dark:bg-slate-950/80">
              <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3.5">Period</th>
                  <th className="px-5 py-3.5 text-right">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(data?.summary ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                      No paid expenses yet
                    </td>
                  </tr>
                ) : (
                  data!.summary.map((point) => (
                    <tr key={point.label} className="hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                      <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100">
                        {formatSummaryLabel(point.label, data!.period)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100">
                        {formatMoney(point.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "category" && (
            <table className="min-w-full bg-white text-sm dark:bg-slate-950/80">
              <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(data?.category_wise ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                      No paid expenses yet
                    </td>
                  </tr>
                ) : (
                  data!.category_wise.map((point) => (
                    <tr key={point.category} className="hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                      <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100">{point.category}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100">
                        {formatMoney(point.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {detailCard && (
        <ExpenseCardDetailModal
          title={detailCard.title}
          status={detailCard.status}
          allowOwnerReview={detailCard.allowOwnerReview}
          onClose={() => setDetailCard(null)}
        />
      )}

      {viewingRequest && (
        <ExpenseRequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />
      )}

      {viewingPurpose !== null && (
        <PurposeTextModal text={viewingPurpose} onClose={() => setViewingPurpose(null)} />
      )}
    </div>
  );
}
