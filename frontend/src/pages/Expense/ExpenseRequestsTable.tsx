import { ReactNode, useState } from "react";
import { Eye, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ExpenseRequestDetailModal from "./ExpenseRequestDetailModal";
import { PaymentRequestItem } from "./types";

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

interface Props {
  requests: PaymentRequestItem[];
  loading: boolean;
  showEmployeeColumn?: boolean;
  renderActions?: (request: PaymentRequestItem) => ReactNode;
  emptyMessage?: string;
}

const formatMoney = (value: string) => `${Number(value || 0).toFixed(2)} BDT`;

const truncateWords = (text: string, wordLimit = 6) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return `${words.slice(0, wordLimit).join(" ")}…`;
};

export default function ExpenseRequestsTable({
  requests,
  loading,
  showEmployeeColumn = false,
  renderActions,
  emptyMessage = "No requests found",
}: Props) {
  const [viewingRequest, setViewingRequest] = useState<PaymentRequestItem | null>(null);
  const [viewingPurpose, setViewingPurpose] = useState<string | null>(null);
  const colSpan = 6 + (showEmployeeColumn ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 dark:border-slate-800">
      <table className="min-w-full bg-white text-sm dark:bg-slate-950/80">
        <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
          <tr>
            {showEmployeeColumn && <th className="px-5 py-3.5">Employee</th>}
            <th className="px-5 py-3.5">Category</th>
            <th className="px-5 py-3.5">Purpose</th>
            <th className="px-5 py-3.5">Amount</th>
            <th className="px-5 py-3.5">Expense Date</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="sticky right-0 z-10 border-l border-slate-200 bg-slate-50/80 px-5 py-3.5 text-right backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">Loading...</td>
            </tr>
          ) : requests.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">{emptyMessage}</td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr key={request.id} className="align-top transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                {showEmployeeColumn && (
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                    {request.employee?.first_name} {request.employee?.last_name}
                  </td>
                )}
                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{request.category?.name || "-"}</td>
                <td className="px-5 py-4 max-w-[240px] text-slate-600 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => setViewingPurpose(request.purpose || "-")}
                    className="text-left transition hover:text-blue-600 dark:hover:text-blue-400"
                    title="Click to view full purpose"
                  >
                    {truncateWords(request.purpose || "-")}
                  </button>
                </td>
                <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                  {formatMoney(request.amount_used ?? request.amount)}
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{request.expense_date}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={request.status} />
                </td>
                <td className="sticky right-0 z-10 border-l border-slate-200 bg-white px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setViewingRequest(request)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Eye size={14} /> View
                    </button>
                    {renderActions?.(request)}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {viewingRequest && (
        <ExpenseRequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />
      )}

      {viewingPurpose !== null && (
        <PurposeTextModal text={viewingPurpose} onClose={() => setViewingPurpose(null)} />
      )}
    </div>
  );
}
