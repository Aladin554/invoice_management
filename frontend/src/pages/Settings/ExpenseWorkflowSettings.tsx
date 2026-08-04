import { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ExpenseSettingsData {
  owner_approval_required: boolean;
}

export default function ExpenseWorkflowSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ownerApprovalRequired, setOwnerApprovalRequired] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<ExpenseSettingsData>("/settings/expense");
      setOwnerApprovalRequired(res.data.owner_approval_required);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load expense settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleToggle = async (checked: boolean) => {
    const previous = ownerApprovalRequired;
    setOwnerApprovalRequired(checked);
    setSaving(true);
    try {
      await api.put("/settings/expense", { owner_approval_required: checked });
      toast.success("Expense settings saved");
    } catch (err: any) {
      setOwnerApprovalRequired(previous);
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Approval Workflow</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Control whether expense requests need your final approval before payment.
          </p>
        </div>

        <div className="px-5 py-6">
          <label
            htmlFor="owner_approval_required"
            className="flex w-full cursor-pointer items-center gap-3 border border-[#667085] px-4 py-3 rounded-lg dark:bg-gray-700"
          >
            <input
              type="checkbox"
              id="owner_approval_required"
              checked={ownerApprovalRequired}
              disabled={saving}
              onChange={(e) => handleToggle(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Require my approval after Finance Manager review
            </span>
          </label>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {ownerApprovalRequired
              ? "Current flow: Employee submits → Finance Manager reviews → Owner approves → Payment."
              : "Current flow: Employee submits → Finance Manager reviews → Payment (your approval is skipped)."}
          </p>
        </div>
      </section>
    </div>
  );
}
