import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCheck, Plus, Upload } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axios";
import { getMeCached } from "../../utils/me";
import ExpenseRequestsTable from "./ExpenseRequestsTable";
import ReviewActionModal from "./ReviewActionModal";
import MoneyProvidedApproveModal from "./MoneyProvidedApproveModal";
import BulkApproveModal from "./BulkApproveModal";
import UsedReceiptModal from "./UsedReceiptModal";
import { ExpenseStatus, PaymentRequestItem, STATUS_LABELS } from "./types";

type ReviewEndpoint = "finance-review" | "owner-review" | "payment";
type ViewMode = "all" | "mine";

export default function AllExpenseRequests() {
  const [searchParams] = useSearchParams();
  const [isOwner, setIsOwner] = useState(false);
  const [isFinanceManager, setIsFinanceManager] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);

  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const initialStatus = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "">(
    (initialStatus as ExpenseStatus) || ""
  );
  // Finance Manager also submits their own requests — rather than sending
  // them to a separate sidebar page, they can flip to "My Requests" here.
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [submitting, setSubmitting] = useState(false);
  const [reviewModalState, setReviewModalState] = useState<{
    request: PaymentRequestItem;
    action: "approve" | "reject";
    endpoint: ReviewEndpoint;
  } | null>(null);
  const [approveModalRequest, setApproveModalRequest] = useState<PaymentRequestItem | null>(null);
  const [settlingRequest, setSettlingRequest] = useState<PaymentRequestItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    // Force a fresh fetch so a just-toggled is_finance_manager flag is
    // reflected immediately, without requiring a full re-login.
    getMeCached({ force: true })
      .then((me) => {
        setIsOwner(me.role_id === 1);
        setIsFinanceManager(Boolean(me.is_finance_manager));
        setCurrentUserId(me.id ?? null);
      })
      .finally(() => setMeLoaded(true));
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expense/requests", {
        params: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(viewMode === "mine" ? { mine: 1 } : {}),
        },
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to load expense requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!meLoaded) return;
    void fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, viewMode, meLoaded]);

  const handleConfirmReview = async (note: string) => {
    if (!reviewModalState) return;
    setSubmitting(true);
    try {
      await api.post(`/expense/requests/${reviewModalState.request.id}/${reviewModalState.endpoint}`, {
        action: reviewModalState.action,
        note: note || undefined,
      });
      toast.success(reviewModalState.action === "approve" ? "Request approved" : "Request rejected");
      setReviewModalState(null);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWithProof = async (formData: FormData) => {
    if (!approveModalRequest) return;
    setSubmitting(true);
    try {
      await api.post(`/expense/requests/${approveModalRequest.id}/finance-review`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Request approved and money marked as provided");
      setApproveModalRequest(null);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update request");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]));
  };

  const toggleSelectAll = (ids: number[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      return allSelected ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]));
    });
  };

  const handleBulkApprove = async (formData: FormData) => {
    setBulkApproving(true);
    try {
      await api.post("/expense/requests/bulk-finance-review", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Selected requests approved and money marked as provided");
      setShowBulkApprove(false);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve selected requests");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleSettle = async (formData: FormData) => {
    if (!settlingRequest) return;
    setSubmitting(true);
    try {
      await api.post(`/expense/requests/${settlingRequest.id}/settle`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Receipt submitted — request settled");
      setSettlingRequest(null);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit receipt");
    } finally {
      setSubmitting(false);
    }
  };

  const renderActions = (request: PaymentRequestItem) => {
    const isOwnRequest = currentUserId !== null && currentUserId === request.employee?.id;

    if (isFinanceManager && !isOwner && isOwnRequest && request.status === "money_provided") {
      return (
        <button
          onClick={() => setSettlingRequest(request)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <Upload size={13} /> Add Receipt
        </button>
      );
    }

    if (isFinanceManager && !isOwner && !isOwnRequest && request.status === "money_provided") {
      return (
        <button
          onClick={() => setReviewModalState({ request, action: "reject", endpoint: "payment" })}
          className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Cancel
        </button>
      );
    }

    if ((isFinanceManager || isOwner) && request.status === "submitted") {
      return (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setApproveModalRequest(request)}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            onClick={() => setReviewModalState({ request, action: "reject", endpoint: "finance-review" })}
            className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Reject
          </button>
        </div>
      );
    }

    if (isOwner && request.status === "finance_approved") {
      return (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setReviewModalState({ request, action: "approve", endpoint: "owner-review" })}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            onClick={() => setReviewModalState({ request, action: "reject", endpoint: "owner-review" })}
            className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Reject
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {viewMode === "mine" ? "My Expense Requests" : "Expense Requests"}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Refreshing..." : `${requests.length} request(s) found.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isFinanceManager && !isOwner && (
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-900/75">
                <button
                  onClick={() => setViewMode("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    viewMode === "all"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  All Requests
                </button>
                <button
                  onClick={() => setViewMode("mine")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    viewMode === "mine"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  My Requests
                </button>
              </div>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | "")}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-200"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {isFinanceManager && !isOwner && (
              <Link
                to="/dashboard/expense/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={18} /> New Request
              </Link>
            )}
          </div>
        </div>

        <div className="px-5 py-5">
          {(isFinanceManager || isOwner) && selectedIds.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {selectedIds.length} request{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowBulkApprove(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCheck size={14} /> Bulk Approve
                </button>
              </div>
            </div>
          )}

          <ExpenseRequestsTable
            requests={requests}
            loading={loading}
            showEmployeeColumn={viewMode === "all"}
            emptyMessage={viewMode === "mine" ? "You haven't submitted any requests yet" : "No expense requests found"}
            renderActions={isFinanceManager || isOwner ? renderActions : undefined}
            isRowSelectable={isFinanceManager || isOwner ? (request) => request.status === "submitted" : undefined}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleSelectAll={toggleSelectAll}
          />
        </div>
      </section>

      {reviewModalState && (
        <ReviewActionModal
          request={reviewModalState.request}
          action={reviewModalState.action}
          submitting={submitting}
          onClose={() => setReviewModalState(null)}
          onConfirm={handleConfirmReview}
        />
      )}

      {approveModalRequest && (
        <MoneyProvidedApproveModal
          request={approveModalRequest}
          submitting={submitting}
          onClose={() => setApproveModalRequest(null)}
          onSubmit={handleApproveWithProof}
        />
      )}

      {showBulkApprove && (
        <BulkApproveModal
          requests={requests.filter((request) => selectedIds.includes(request.id))}
          submitting={bulkApproving}
          onClose={() => setShowBulkApprove(false)}
          onSubmit={handleBulkApprove}
        />
      )}

      {settlingRequest && (
        <UsedReceiptModal
          request={settlingRequest}
          submitting={submitting}
          onClose={() => setSettlingRequest(null)}
          onSubmit={handleSettle}
        />
      )}
    </div>
  );
}
