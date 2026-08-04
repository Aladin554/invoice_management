import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Send } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface WhatsAppSettingsData {
  phone_number_id: string | null;
  business_account_id: string | null;
  owner_phone: string | null;
  is_enabled: boolean;
  access_token_set: boolean;
  access_token_preview: string | null;
}

export default function WhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  const [form, setForm] = useState({
    phone_number_id: "",
    access_token: "",
    business_account_id: "",
    owner_phone: "",
    is_enabled: false,
  });
  const [accessTokenPreview, setAccessTokenPreview] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<WhatsAppSettingsData>("/settings/whatsapp");
      setForm({
        phone_number_id: res.data.phone_number_id || "",
        access_token: "",
        business_account_id: res.data.business_account_id || "",
        owner_phone: res.data.owner_phone || "",
        is_enabled: res.data.is_enabled,
      });
      setAccessTokenPreview(res.data.access_token_preview);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load WhatsApp settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone_number_id.trim()) {
      toast.error("Phone Number ID is required");
      return;
    }

    setSaving(true);
    try {
      await api.put("/settings/whatsapp", {
        phone_number_id: form.phone_number_id.trim(),
        access_token: form.access_token.trim() || undefined,
        business_account_id: form.business_account_id.trim() || null,
        owner_phone: form.owner_phone.trim() || null,
        is_enabled: form.is_enabled,
      });
      toast.success("WhatsApp settings saved");
      setForm((prev) => ({ ...prev, access_token: "" }));
      await fetchSettings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Enter a phone number to send the test message to");
      return;
    }
    setTesting(true);
    try {
      await api.post("/settings/whatsapp/test", { phone: testPhone.trim() });
      toast.success("Test message sent successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send test message");
    } finally {
      setTesting(false);
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
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">WhatsApp Notifications</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Connect your Meta WhatsApp Business Cloud API to remind you (the Owner) whenever an expense request is
            waiting on your approval. No messages are sent to employees or Finance Managers.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 px-5 py-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_enabled"
              checked={form.is_enabled}
              onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_enabled" className="text-sm font-medium dark:text-gray-300">
              Enable WhatsApp notifications
            </label>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Your WhatsApp Number</label>
            <input
              type="text"
              value={form.owner_phone}
              onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              placeholder="e.g. 8801XXXXXXXXX"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pending-approval reminders will be sent to this number only.
            </p>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">Phone Number ID</label>
            <input
              type="text"
              value={form.phone_number_id}
              onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              placeholder="e.g. 123456789012345"
            />
            <p className="text-xs text-gray-500 mt-1">From Meta App Dashboard → WhatsApp → API Setup.</p>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">
              Access Token {accessTokenPreview ? `(current: ${accessTokenPreview})` : ""}
            </label>
            <input
              type="password"
              value={form.access_token}
              onChange={(e) => setForm({ ...form, access_token: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              placeholder={accessTokenPreview ? "Leave blank to keep unchanged" : "Enter access token"}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">
              WhatsApp Business Account ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.business_account_id}
              onChange={(e) => setForm({ ...form, business_account_id: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Send Test Message</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verify your credentials by sending a test message to any WhatsApp number.
          </p>
        </div>

        <div className="flex flex-col gap-3 px-5 py-6 sm:flex-row">
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="e.g. 8801XXXXXXXXX"
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send size={16} /> {testing ? "Sending..." : "Send Test"}
          </button>
        </div>
      </section>
    </div>
  );
}
