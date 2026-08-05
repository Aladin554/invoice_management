import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pencil, Plus, Upload } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axios";
import ExpenseRequestsTable from "./ExpenseRequestsTable";
import UsedReceiptModal from "./UsedReceiptModal";
import { PaymentRequestItem } from "./types";

export default function MyExpenseRequests() {
  const location = useLocation();
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settlingRequest, setSettlingRequest] = useState<PaymentRequestItem | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expense/requests", { params: { mine: 1 } });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load your payment requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  useEffect(() => {
    const state = location.state as { message?: string; type?: "success" | "error" } | null;
    if (state?.message) {
      state.type === "error" ? toast.error(state.message) : toast.success(state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Payment Requests</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Refreshing..." : `${requests.length} request(s) submitted so far.`}
            </p>
          </div>

          <Link
            to="/dashboard/expense/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> New Request
          </Link>
        </div>

        <div className="px-5 py-5">
          <ExpenseRequestsTable
            requests={requests}
            loading={loading}
            emptyMessage="You haven't submitted any requests yet"
            renderActions={(request) => {
              if (request.status === "submitted") {
                return (
                  <Link
                    to={`/dashboard/expense/${request.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Pencil size={13} /> Edit
                  </Link>
                );
              }
              if (request.status === "money_provided") {
                return (
                  <button
                    onClick={() => setSettlingRequest(request)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Upload size={13} /> Add Receipt
                  </button>
                );
              }
              return null;
            }}
          />
        </div>
      </section>

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
