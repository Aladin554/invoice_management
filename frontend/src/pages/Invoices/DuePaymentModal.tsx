import { useState } from "react";
import { Paperclip, Wallet, X } from "lucide-react";
import api from "../../api/axios";

interface Props {
  invoiceId: number;
  receiptNumber: string;
  dueAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const formatMoney = (value: number) => `${Number(value || 0).toFixed(2)} BDT`;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "pos", label: "POS" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function DuePaymentModal({ invoiceId, receiptNumber, dueAmount, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(dueAmount ? dueAmount.toFixed(2) : "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Only cash is cash; every other method is non-cash and needs proof.
  const isCash = paymentMethod === "cash";
  const remaining = Math.max(0, dueAmount - Number(amount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount || 0);
    if (value <= 0) {
      setError("Enter a payment amount.");
      return;
    }
    if (value > dueAmount) {
      setError("Payment can't be more than the due amount.");
      return;
    }
    if (!isCash && !proof) {
      setError("Attach the payment proof for non-cash payments.");
      return;
    }

    const data = new FormData();
    data.append("amount", String(value));
    data.append("payment_method", paymentMethod);
    if (note.trim()) data.append("note", note.trim());
    if (proof) data.append("proof", proof);

    setSubmitting(true);
    try {
      await api.post(`/invoices/${invoiceId}/due-payment`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Wallet size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Pay Due</h2>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Receipt {receiptNumber} — {formatMoney(dueAmount)} outstanding
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={dueAmount}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-14 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                BDT
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Remaining after this payment: <span className="font-medium">{formatMoney(remaining)}</span>
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => {
                const selected = paymentMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.value);
                      setError("");
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Proof{" "}
              <span className="font-normal text-gray-400">{isCash ? "(optional)" : "(required)"}</span>
            </label>
            <label className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3.5 py-2.5 transition hover:border-amber-400 hover:bg-amber-50/60 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-amber-500/50">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500">
                <Paperclip size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {proof ? proof.name : "Attach a file"}
                </span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">JPG, PNG or PDF — max 10MB</span>
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
