import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getMeCached } from "../../utils/me";

interface InvoiceData {
  invoice: any;
  header_text: string;
  footer_text: string;
  logo_url: string;
  public_link?: string;
  contract_download_url?: string | null;
  payment_evidence_url?: string | null;
  student_photo_url?: string | null;
}

interface EditorOption {
  id: number;
  first_name: string;
  last_name: string;
}

const formatDate = (value?: string) => (value ? new Date(value).toISOString().split("T")[0] : "-");

export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [signName, setSignName] = useState("");
  const [signPhoto, setSignPhoto] = useState<File | null>(null);
  const [editorOptions, setEditorOptions] = useState<EditorOption[]>([]);
  const [selectedEditorId, setSelectedEditorId] = useState("");

  useEffect(() => {
    getMeCached({ force: true }).then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (id) void fetchInvoice(id);
  }, [id]);

  const isSuperAdmin = Number(me?.role_id) === 1;

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get("/users")
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : [];
        const admins = users.filter((user: any) => Number(user.role_id) === 2);
        setEditorOptions(admins);
      })
      .catch(() => setEditorOptions([]));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (data?.invoice?.edit_override_user_id) {
      setSelectedEditorId(String(data.invoice.edit_override_user_id));
    }
  }, [data?.invoice?.edit_override_user_id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${invoiceId}`);
      setData(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice");
      navigate("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToPreview = async () => {
    if (!id) return;
    try {
      await api.post(`/invoices/${id}/preview`);
      toast.success("Invoice moved to preview and sent to student");
      await fetchInvoice(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to move to preview");
    }
  };

  const handleApproveCash = async () => {
    if (!id) return;
    try {
      await api.post(`/invoices/${id}/approve-cash`);
      toast.success("Cash payment approved");
      await fetchInvoice(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve cash payment");
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await api.post(`/invoices/${id}/approve`);
      toast.success("Invoice approved");
      await fetchInvoice(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve invoice");
    }
  };

  const handleAdminSign = async () => {
    if (!id) return;
    if (!signName.trim()) {
      toast.error("Signature name is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("signature_name", signName.trim());
      if (signPhoto) formData.append("photo", signPhoto);

      await api.post(`/invoices/${id}/admin-sign`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Signed on behalf of student");
      await fetchInvoice(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to sign");
    }
  };

  if (loading || !data) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  const { invoice } = data;
  const isAdmin = Number(me?.role_id) === 2 || isSuperAdmin;
  const isCash = invoice.payment_method === "cash";
  const assignedEditor = editorOptions.find((editor) => editor.id === invoice.edit_override_user_id);

  const handleAssignEditor = async () => {
    if (!id) return;
    if (!selectedEditorId) {
      toast.error("Select an admin to assign");
      return;
    }
    try {
      await api.post(`/invoices/${id}/assign-editor`, {
        edit_override_user_id: Number(selectedEditorId),
      });
      toast.success("Editor assigned");
      await fetchInvoice(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign editor");
    }
  };

  return (
    <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-700 dark:bg-gray-900 bg-white w-full max-w-[1200px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/dashboard/invoices")}
          className="px-4 py-2 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <button
              onClick={handleMoveToPreview}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Move to Preview
            </button>
          )}
          {isCash && !invoice.cash_manager_approved_at && isAdmin && (
            <button
              onClick={handleApproveCash}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
            >
              Approve Cash (Manager)
            </button>
          )}
          {!invoice.super_admin_approved_at && isSuperAdmin && (
            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Approve (Super Admin)
            </button>
          )}
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <img src={data.logo_url} alt="Company Logo" className="h-12 mb-2" />
            <div className="text-sm text-gray-700 dark:text-gray-300">{data.header_text}</div>
          </div>
          <div className="text-right text-sm text-gray-700 dark:text-gray-300">
            <div>Invoice: {invoice.invoice_number}</div>
            <div>Date: {formatDate(invoice.invoice_date)}</div>
            <div>Status: {invoice.status}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200">Branch</div>
            <div>{invoice.branch?.name}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200">Customer</div>
            <div>{invoice.customer?.first_name} {invoice.customer?.last_name}</div>
            <div>{invoice.customer?.email}</div>
            <div>{invoice.customer?.phone}</div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="min-w-full text-base">
            <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">${Number(item.price).toFixed(2)}</td>
                  <td className="px-4 py-2">${Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right text-sm text-gray-700 dark:text-gray-300">
          <div>Subtotal: ${Number(invoice.subtotal).toFixed(2)}</div>
          <div>
            Discount: -$
            {invoice.discount_type === "percent"
              ? ((Number(invoice.subtotal) * Number(invoice.discount_value || 0)) / 100).toFixed(2)
              : Number(invoice.discount_value || 0).toFixed(2)}
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Total: ${Number(invoice.total).toFixed(2)}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <div>Payment Method: {invoice.payment_method || "-"}</div>
          {data.payment_evidence_url && (
            <div>
              Payment Evidence: <a href={data.payment_evidence_url} className="text-blue-600 underline">View</a>
            </div>
          )}
          <div>Contract: {invoice.contract_template?.name || "-"}</div>
          {data.contract_download_url && (
            <div>
              Contract File:{" "}
              <a
                href={data.contract_download_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Download
              </a>
            </div>
          )}
          {data.public_link && (
            <div>
              Share Link: <a href={data.public_link} className="text-blue-600 underline">{data.public_link}</a>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">{data.footer_text}</div>
      </div>

      {isAdmin && (
        <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Manual Student Signature</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Signature name"
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              className="border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSignPhoto(e.target.files?.[0] || null)}
              className="border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              onClick={handleAdminSign}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-gray-700"
            >
              Sign on Behalf
            </button>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Assign Editor</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <select
              value={selectedEditorId}
              onChange={(e) => setSelectedEditorId(e.target.value)}
              className="border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">Select admin</option>
              {editorOptions.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.first_name} {editor.last_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignEditor}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Assign
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Current: {assignedEditor ? `${assignedEditor.first_name} ${assignedEditor.last_name}` : invoice.edit_override_user_id ? `User #${invoice.edit_override_user_id}` : "None"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
