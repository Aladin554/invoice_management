import { useState } from "react";
import { X } from "lucide-react";
import { PaymentRequestItem } from "./types";

interface Props {
  request: PaymentRequestItem;
  action: "approve" | "reject";
  submitting: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

const TEXT: Record<
  Props["action"],
  { title: string; confirmLabel: string; placeholder: string; noteLabel: string; subtitle?: string }
> = {
  approve: {
    title: "Approve Request",
    confirmLabel: "Confirm Approve",
    placeholder: "Add a note (optional)",
    noteLabel: "Note (optional)",
  },
  reject: {
    title: "Reject Request",
    confirmLabel: "Confirm Reject",
    placeholder: "Explain why this request is being rejected",
    noteLabel: "Note (reason for rejection)",
  },
};

export default function ReviewActionModal({ request, action, submitting, onClose, onConfirm }: Props) {
  const [note, setNote] = useState("");
  const isReject = action === "reject";
  const text = TEXT[action];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{text.title}</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure? {request.employee?.first_name} {request.employee?.last_name} — {request.category?.name} —{" "}
            {Number(request.amount || 0).toFixed(2)} BDT
          </p>
          {text.subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{text.subtitle}</p>}
        </div>

        <label className="block mb-1 text-sm font-medium dark:text-gray-300">{text.noteLabel}</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
          placeholder={text.placeholder}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || (isReject && !note.trim())}
            onClick={() => onConfirm(note.trim())}
            className={`px-6 py-3 rounded-lg text-white disabled:opacity-50 ${
              isReject ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {submitting ? "Saving..." : text.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
