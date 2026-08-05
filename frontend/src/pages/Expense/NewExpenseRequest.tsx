import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { ArrowLeft, Banknote, Landmark, Layers, Smartphone, Wallet } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ExpenseCategoryItem, PaymentPreference } from "./types";

const PAYMENT_OPTIONS: { value: PaymentPreference; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "bkash", label: "bKash", icon: Smartphone },
  { value: "nagad", label: "Nagad", icon: Smartphone },
];

export default function NewExpenseRequest() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    purpose: "",
    payment_preference: "" as PaymentPreference | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get("/expense/categories")
      .then((res) => {
        const active = (Array.isArray(res.data) ? res.data : []).filter((c: ExpenseCategoryItem) => c.is_active);
        setCategories(active);
      })
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/expense/requests/${id}`)
      .then((res) => {
        const request = res.data;
        if (request.status !== "submitted") {
          toast.error("This request can no longer be edited");
          navigate("/dashboard/expense/my-requests");
          return;
        }
        setForm({
          category_id: String(request.category?.id ?? ""),
          amount: String(request.amount ?? ""),
          purpose: request.purpose ?? "",
          payment_preference: request.payment_preference ?? "",
        });
      })
      .catch(() => {
        toast.error("Failed to load request");
        navigate("/dashboard/expense/my-requests");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.category_id) next.category_id = "Category is required.";
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Enter a valid amount.";
    if (!form.purpose.trim()) next.purpose = "Purpose is required.";
    if (!form.payment_preference) next.payment_preference = "Select a payment preference.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        category_id: form.category_id,
        amount: form.amount,
        purpose: form.purpose,
        payment_preference: form.payment_preference,
      };

      if (isEditMode) {
        await api.put(`/expense/requests/${id}`, payload);
      } else {
        await api.post("/expense/requests", payload);
      }

      navigate("/dashboard/expense/my-requests", {
        state: {
          message: isEditMode ? "Payment request updated successfully!" : "Payment request submitted successfully!",
          type: "success",
        },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Wallet size={20} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isEditMode ? "Edit Payment Request" : "New Payment Request"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isEditMode ? "Update your request before Finance reviews it." : "Submit an expense for Finance review."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Expense Category
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Layers size={16} />
                </span>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
                    errors.category_id
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-200 focus:ring-blue-500 dark:border-slate-700"
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {errors.category_id && <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-3 pr-14 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
                    errors.amount
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-200 focus:ring-blue-500 dark:border-slate-700"
                  }`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  BDT
                </span>
              </div>
              {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Payment Preference
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = form.payment_preference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, payment_preference: option.value })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={18} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.payment_preference && <p className="mt-1 text-sm text-red-500">{errors.payment_preference}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Purpose</label>
            <textarea
              rows={4}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
                errors.purpose
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-200 focus:ring-blue-500 dark:border-slate-700"
              }`}
              placeholder="Explain what this expense is for"
            />
            {errors.purpose && <p className="mt-1 text-sm text-red-500">{errors.purpose}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/dashboard/expense/my-requests")}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Submit Request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
