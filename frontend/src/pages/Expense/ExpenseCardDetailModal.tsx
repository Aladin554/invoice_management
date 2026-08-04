import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import ExpenseRequestsTable from "./ExpenseRequestsTable";
import ReviewActionModal from "./ReviewActionModal";
import { ExpenseStatus, PaymentRequestItem } from "./types";

interface Props {
  title: string;
  status: ExpenseStatus;
  allowOwnerReview?: boolean;
  onClose: () => void;
}

export default function ExpenseCardDetailModal({ title, status, allowOwnerReview = false, onClose }: Props) {
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewState, setReviewState] = useState<{ request: PaymentRequestItem; action: "approve" | "reject" } | null>(
    null
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expense/requests", { params: { status } });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleConfirm = async (note: string) => {
    if (!reviewState) return;
    setSubmitting(true);
    try {
      await api.post(`/expense/requests/${reviewState.request.id}/owner-review`, {
        action: reviewState.action,
        note: note || undefined,
      });
      toast.success(reviewState.action === "approve" ? "Request approved" : "Request rejected");
      setReviewState(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="no-scrollbar max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <ExpenseRequestsTable
          requests={requests}
          loading={loading}
          showEmployeeColumn
          emptyMessage="Nothing to show here"
          renderActions={
            allowOwnerReview
              ? (request) =>
                  request.status === "finance_approved" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReviewState({ request, action: "approve" })}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setReviewState({ request, action: "reject" })}
                        className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null
              : undefined
          }
        />

        <div className="mt-4 text-right">
          <Link
            to={`/dashboard/expense/requests?status=${status}`}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            onClick={onClose}
          >
            View all in Expense Requests →
          </Link>
        </div>
      </div>

      {reviewState && (
        <ReviewActionModal
          request={reviewState.request}
          action={reviewState.action}
          submitting={submitting}
          onClose={() => setReviewState(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
