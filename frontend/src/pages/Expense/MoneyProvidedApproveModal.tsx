import { useState } from "react";
import { X, FileText } from "lucide-react";
import { PaymentRequestItem } from "./types";

interface Props {
  request: PaymentRequestItem;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export default function MoneyProvidedApproveModal({ request, submitting, onClose, onSubmit }: Props) {
  const [proofs, setProofs] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProofs((prev) => [...prev, ...Array.from(files)]);
    setError("");
  };

  const removeFile = (index: number) => {
    setProofs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (proofs.length === 0) {
      setError("Please attach at least one proof that the money was provided.");
      return;
    }

    const data = new FormData();
    data.append("action", "approve");
    proofs.forEach((file) => data.append("money_provided_proof[]", file));
    if (note.trim()) data.append("note", note.trim());
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Approve &amp; Provide Money</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {request.employee?.first_name} {request.employee?.last_name} — {request.category?.name} —{" "}
          {Number(request.amount || 0).toFixed(2)} BDT
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Attach proof that you've handed the money over to the employee (photo, screenshot, receipt copy). You can
          attach multiple files.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Money Provided Proof</label>
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

            {proofs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {proofs.map((file, index) => (
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
              {submitting ? "Saving..." : "Confirm Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
