import { useState } from "react";
import { Paperclip, Plus, Receipt, X } from "lucide-react";
import { PaymentRequestItem } from "./types";

interface Props {
  request: PaymentRequestItem;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UsedReceiptModal({ request, submitting, onClose, onSubmit }: Props) {
  const [fileSlots, setFileSlots] = useState<(File | null)[]>([null]);
  const [amountReturned, setAmountReturned] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Amount Used is derived, not entered directly — it's always what was
  // provided minus whatever the employee reports returning as unused.
  const amountUsed = Math.max(0, Number(request.amount || 0) - Number(amountReturned || 0)).toFixed(2);

  const setSlotFile = (index: number, file: File | null) => {
    setFileSlots((prev) => prev.map((f, i) => (i === index ? file : f)));
    setError("");
  };

  const addSlot = () => setFileSlots((prev) => [...prev, null]);

  const removeSlot = (index: number) => {
    setFileSlots((prev) => (prev.length === 1 ? [null] : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receipts = fileSlots.filter((f): f is File => f !== null);
    if (receipts.length === 0) {
      setError("Please attach at least one receipt showing how the money was used.");
      return;
    }
    if (Number(amountReturned || 0) > Number(request.amount || 0)) {
      setError("Amount returned can't be more than the amount provided.");
      return;
    }

    const data = new FormData();
    receipts.forEach((file) => data.append("used_receipt[]", file));
    data.append("amount_used", amountUsed);
    if (amountReturned) data.append("amount_returned", amountReturned);
    if (note.trim()) data.append("note", note.trim());
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="no-scrollbar max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Receipt size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Attach Used Receipt</h2>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {request.category?.name} — {Number(request.amount || 0).toFixed(2)} BDT provided
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Attach proof of how you spent the money. Add more rows for multiple receipts. Any unused amount should
            be returned to Finance.
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Used Receipt{fileSlots.length > 1 ? "s" : ""}
            </label>
            <div className="space-y-2.5">
              {fileSlots.map((file, index) => (
                <div key={index} className="flex items-center gap-2">
                  <label className="group relative flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3.5 py-2.5 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500">
                      <Paperclip size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                        {file ? file.name : `Receipt ${index + 1}`}
                      </span>
                      <span className="block text-xs text-gray-400 dark:text-gray-500">
                        {file ? formatFileSize(file.size) : "JPG, PNG or PDF — click to choose"}
                      </span>
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setSlotFile(index, e.target.files?.[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  {fileSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSlot}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-emerald-500/60 dark:hover:text-emerald-400"
            >
              <Plus size={16} /> Add another file
            </button>

            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Max 10MB per file.</p>
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Used</label>
              <input
                type="text"
                readOnly
                value={amountUsed}
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Provided minus returned.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount Returned
              </label>
              <input
                type="number"
                min="0"
                max={request.amount}
                step="0.01"
                value={amountReturned}
                onChange={(e) => setAmountReturned(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

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
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
