import { ReactNode, useState } from "react";
import { Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ExpenseRequestDetailModal from "./ExpenseRequestDetailModal";
import { PaymentRequestItem } from "./types";

interface Props {
  requests: PaymentRequestItem[];
  loading: boolean;
  showEmployeeColumn?: boolean;
  renderActions?: (request: PaymentRequestItem) => ReactNode;
  emptyMessage?: string;
}

const formatMoney = (value: string) => `${Number(value || 0).toFixed(2)} BDT`;

export default function ExpenseRequestsTable({
  requests,
  loading,
  showEmployeeColumn = false,
  renderActions,
  emptyMessage = "No requests found",
}: Props) {
  const [viewingRequest, setViewingRequest] = useState<PaymentRequestItem | null>(null);
  const colSpan = 5 + (showEmployeeColumn ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 dark:border-slate-800">
      <table className="min-w-full bg-white text-sm dark:bg-slate-950/80">
        <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
          <tr>
            {showEmployeeColumn && <th className="px-5 py-3.5">Employee</th>}
            <th className="px-5 py-3.5">Category</th>
            <th className="px-5 py-3.5">Amount</th>
            <th className="px-5 py-3.5">Expense Date</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
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
                <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                  {formatMoney(request.amount_used ?? request.amount)}
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{request.expense_date}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-5 py-4">
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
    </div>
  );
}
