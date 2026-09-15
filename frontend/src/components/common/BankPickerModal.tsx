import { useState } from "react";
import { X } from "lucide-react";
import BankSelect from "./BankSelect";
import { useBankOptions } from "../../utils/banks";

interface BankPickerModalProps {
  value: string;
  onSelect: (bankName: string) => void;
  onClose: () => void;
}

export default function BankPickerModal({ value, onSelect, onClose }: BankPickerModalProps) {
  const [bankName, setBankName] = useState(value);
  const [bankOptions, addBankOption] = useBankOptions();

  const handleSave = () => {
    const trimmed = bankName.trim();
    if (!trimmed) return;
    // A custom name typed via "Other" isn't in the shared list yet — add it
    // now that the user has actually confirmed it, rather than eagerly on
    // blur (which fought with re-renders and needed two clicks to save).
    if (!bankOptions.includes(trimmed)) addBankOption(trimmed);
    onSelect(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Select Bank</h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Bank</label>
          <BankSelect
            value={bankName}
            onChange={setBankName}
            selectClassName="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            inputClassName="mt-2 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!bankName.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
