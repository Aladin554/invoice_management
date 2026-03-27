import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface PublicInvoiceData {
  invoice: any;
  header_text: string;
  footer_text: string;
  logo_url: string;
  contract_download_url?: string | null;
  student_photo_url?: string | null;
}

const formatDate = (value?: string) => (value ? new Date(value).toISOString().split("T")[0] : "-");

export default function InvoicePublic() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [agree, setAgree] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      void fetchInvoice(token);
    }
  }, [token]);

  const fetchInvoice = async (tokenValue: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/invoices/public/${tokenValue}`);
      setData(res.data);
    } catch {
      setMessage("Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!token) return;
    if (!signatureName.trim()) {
      setMessage("Signature name is required");
      return;
    }
    if (!agree) {
      setMessage("You must agree to the terms");
      return;
    }
    if (!photo) {
      setMessage("Photo upload is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("signature_name", signatureName.trim());
      formData.append("agree", agree ? "1" : "0");
      formData.append("photo", photo);

      await axios.post(`/api/invoices/public/${token}/sign`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Thank you! Your signature has been recorded.");
      await fetchInvoice(token);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Failed to submit signature");
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6 text-gray-500">{message || "Invoice not found"}</div>;
  }

  const { invoice } = data;
  const hasStudentSignature = Boolean(
    invoice?.student_signed_at ||
      invoice?.student_signature_name ||
      data.student_photo_url
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <img src={data.logo_url} alt="Company Logo" className="h-12 mb-2" />
            <div className="text-sm text-gray-700">{data.header_text}</div>
          </div>
          <div className="text-right text-sm text-gray-700">
            <div>Invoice: {invoice.invoice_number}</div>
            <div>Date: {formatDate(invoice.invoice_date)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <div className="font-semibold text-gray-800">Branch</div>
            <div>{invoice.branch?.name}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">Customer</div>
            <div>{invoice.customer?.first_name} {invoice.customer?.last_name}</div>
            <div>{invoice.customer?.email}</div>
            <div>{invoice.customer?.phone}</div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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

        <div className="mt-4 text-right text-sm text-gray-700">
          <div>Subtotal: ${Number(invoice.subtotal).toFixed(2)}</div>
          <div>
            Discount: -$
            {invoice.discount_type === "percent"
              ? ((Number(invoice.subtotal) * Number(invoice.discount_value || 0)) / 100).toFixed(2)
              : Number(invoice.discount_value || 0).toFixed(2)}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            Total: ${Number(invoice.total).toFixed(2)}
          </div>
        </div>

        {data.contract_download_url && (
          <div className="mt-4 text-sm">
            Contract:{" "}
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

        <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
          {data.footer_text}
        </div>
      </div>

      {hasStudentSignature ? (
        <div className="max-w-4xl mx-auto mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Signature</h2>
          {message && <div className="mb-3 text-sm text-blue-700">{message}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <div className="font-semibold text-gray-800">Name</div>
              <div>{invoice.student_signature_name || "-"}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">Signed At</div>
              <div>{formatDate(invoice.student_signed_at)}</div>
            </div>
          </div>
          {data.student_photo_url && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Photo</div>
              <img
                src={data.student_photo_url}
                alt="Signature Photo"
                className="w-full max-w-xs rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Sign & Upload Photo</h2>
          {message && <div className="mb-3 text-sm text-blue-700">{message}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Type your full name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="border px-3 py-2 rounded-lg text-base"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="border px-3 py-2 rounded-lg text-base"
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to the terms and conditions
          </label>
          <button
            onClick={handleSign}
            className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
