import { useState } from "react";
import { X, FileText } from "lucide-react";
import { PaymentRequestItem } from "./types";

interface Props {
  request: PaymentRequestItem;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export default function UsedReceiptModal({ request, submitting, onClose, onSubmit }: Props) {
  const [receipts, setReceipts] = useState<File[]>([]);
  const [amountReturned, setAmountReturned] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Amount Used is derived, not entered directly — it's always what was
  // provided minus whatever the employee reports returning as unused.
  const amountUsed = Math.max(0, Number(request.amount || 0) - Number(amountReturned || 0)).toFixed(2);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setReceipts((prev) => [...prev, ...Array.from(files)]);
    setError("");
  };

  const removeFile = (index: number) => {
    setReceipts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attach Used Receipt</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {request.category?.name} — {Number(request.amount || 0).toFixed(2)} BDT provided
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Attach proof of how you spent the money. You can attach multiple receipts. Any unused amount should be
          returned to Finance.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Used Receipt</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF. Max 10MB each. You can select multiple files.</p>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            {receipts.length > 0 && (
              <ul className="mt-2 space-y-1">
                {receipts.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-700"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-gray-700 dark:text-gray-200">
                      <FileText size={14} className="shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium dark:text-gray-300">Amount Used</label>
              <input
                type="text"
                readOnly
                value={amountUsed}
                className="w-full border px-3 py-2 rounded-lg text-base bg-gray-100 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">Provided minus amount returned.</p>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium dark:text-gray-300">Amount Returned</label>
              <input
                type="number"
                min="0"
                max={request.amount}
                step="0.01"
                value={amountReturned}
                onChange={(e) => setAmountReturned(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
