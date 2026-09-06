import { useState } from "react";
import { Banknote, Paperclip, Plus, X } from "lucide-react";
import { PaymentRequestItem } from "./types";

interface Props {
  requests: PaymentRequestItem[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function BulkApproveModal({ requests, submitting, onClose, onSubmit }: Props) {
  const allCash = requests.every((request) => request.payment_preference === "cash");
  const [fileSlots, setFileSlots] = useState<(File | null)[]>([null]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const totalAmount = requests.reduce((sum, request) => sum + Number(request.amount || 0), 0);

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
    const proofs = fileSlots.filter((f): f is File => f !== null);
    if (proofs.length === 0 && !allCash) {
      setError("Please attach at least one proof that the money was provided.");
      return;
    }

    const data = new FormData();
    requests.forEach((request) => data.append("ids[]", String(request.id)));
    data.append("action", "approve");
    proofs.forEach((file) => data.append("money_provided_proof[]", file));
    if (note.trim()) data.append("note", note.trim());
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="no-scrollbar max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Banknote size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Bulk Approve &amp; Provide Money</h2>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {requests.length} request{requests.length > 1 ? "s" : ""} — {totalAmount.toFixed(2)} BDT total
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
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
            {requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {request.employee?.first_name} {request.employee?.last_name} — {request.category?.name}
                </span>
                <span className="shrink-0 font-medium text-gray-700 dark:text-gray-300">
                  {Number(request.amount || 0).toFixed(2)} BDT
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Attach one shared proof that you've handed the money over — it will be applied to all{" "}
            {requests.length} selected requests. Add more rows for multiple files.
            {allCash && " Optional since all selected requests are cash."}
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Money Provided Proof{fileSlots.length > 1 ? "s" : ""}{" "}
              {allCash && <span className="font-normal text-gray-400">(optional)</span>}
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
                        {file ? file.name : `Proof ${index + 1}`}
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
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
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
              {submitting ? "Saving..." : `Approve ${requests.length} Request${requests.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
