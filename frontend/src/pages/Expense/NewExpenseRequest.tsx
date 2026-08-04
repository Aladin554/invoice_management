import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import api from "../../api/axios";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ExpenseCategoryItem, PaymentPreference } from "./types";

const formatDateYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NewExpenseRequest() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    purpose: "",
    expense_date: "",
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

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.category_id) next.category_id = "Category is required.";
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Enter a valid amount.";
    if (!form.purpose.trim()) next.purpose = "Purpose is required.";
    if (!form.expense_date) next.expense_date = "Expense date is required.";
    if (!form.payment_preference) next.payment_preference = "Select a payment preference.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post("/expense/requests", {
        category_id: form.category_id,
        amount: form.amount,
        purpose: form.purpose,
        expense_date: form.expense_date,
        payment_preference: form.payment_preference,
      });

      navigate("/dashboard/expense/my-requests", {
        state: { message: "Payment request submitted successfully!", type: "success" },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 sm:p-12 border border-gray-200 rounded-2xl dark:border-gray-700 dark:bg-gray-900 shadow-sm max-w-3xl mx-auto w-full">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-3 py-2 mb-6 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>

      <h1 className="text-2xl font-semibold mb-6 dark:text-gray-200">New Payment Request</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Expense Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={`w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${errors.category_id ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${errors.amount ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Expense Date</label>
            <div className="relative w-full flatpickr-wrapper">
              <Flatpickr
                value={form.expense_date}
                onChange={(dates) => setForm({ ...form, expense_date: dates[0] ? formatDateYMD(dates[0]) : "" })}
                options={{ dateFormat: "Y-m-d", maxDate: "today", allowInput: true }}
                placeholder="Select expense date"
                className={`w-full border px-3 py-2 pr-10 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${errors.expense_date ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <CalendarIcon size={18} />
              </span>
            </div>
            {errors.expense_date && <p className="text-red-500 text-sm mt-1">{errors.expense_date}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Payment Preference</label>
            <select
              value={form.payment_preference}
              onChange={(e) => setForm({ ...form, payment_preference: e.target.value as PaymentPreference })}
              className={`w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${errors.payment_preference ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
            >
              <option value="">Select preference</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
            </select>
            {errors.payment_preference && <p className="text-red-500 text-sm mt-1">{errors.payment_preference}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Purpose</label>
            <textarea
              rows={3}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className={`w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${errors.purpose ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
              placeholder="Explain what this expense is for"
            />
            {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/expense/my-requests")}
            className="px-5 py-2 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-base disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
