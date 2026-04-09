import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CustomerProfileSummary from "../../components/invoices/CustomerProfileSummary";
import {
  createCustomerProfileForm,
  CustomerProfileFormValues,
  CustomerProfileSnapshot,
  DOCUMENT_OPTIONS,
  ENGLISH_LANGUAGE_PROFICIENCY_OPTIONS,
  getFirstValidationError,
} from "../../utils/customerProfile";

interface InvoiceCustomer extends CustomerProfileSnapshot {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface InvoiceLineItem {
  id?: number | string;
  name?: string | null;
  price?: number | string | null;
  line_total?: number | string | null;
}

interface PublicInvoice {
  invoice_number?: string | null;
  invoice_date?: string | null;
  subtotal?: number | string | null;
  total?: number | string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  customer_profile_submitted_at?: string | null;
  student_signed_at?: string | null;
  student_signature_name?: string | null;
  show_student_information?: boolean | null;
  show_no_refund_contract?: boolean | null;
  branch?: { name?: string | null } | null;
  customer?: InvoiceCustomer | null;
  items?: InvoiceLineItem[];
}

interface PublicInvoiceData {
  invoice: PublicInvoice;
  header_text: string;
  footer_text: string;
  logo_url: string;
  contract_download_url?: string | null;
  no_refund_contract_download_url?: string | null;
  student_photo_url?: string | null;
  message?: string;
}

interface FeedbackState {
  type: "success" | "error";
  text: string;
}

type ProfileTextField = Exclude<
  keyof CustomerProfileFormValues,
  "available_documents" | "english_language_proficiencies"
>;

const academicProfileFields: Array<{
  key: Extract<
    ProfileTextField,
    | "academic_profile_ssc"
    | "academic_profile_hsc"
    | "academic_profile_bachelor"
    | "academic_profile_masters"
  >;
  label: string;
  placeholder: string;
}> = [
  {
    key: "academic_profile_ssc",
    label: "SSC or O Level",
    placeholder: "Mention grades and grading scale percentage",
  },
  {
    key: "academic_profile_hsc",
    label: "HSC or A Level",
    placeholder: "Mention grades and grading scale percentage",
  },
  {
    key: "academic_profile_bachelor",
    label: "Bachelor",
    placeholder: "Mention grades and grading scale percentage",
  },
  {
    key: "academic_profile_masters",
    label: "Masters",
    placeholder: "Mention grades and grading scale percentage",
  },
];

const formatDate = (value?: string | null) =>
  value ? new Date(value).toISOString().split("T")[0] : "-";

const formatMoney = (value?: number | string | null) => Number(value || 0).toFixed(2);

const getErrorMessage = (error: any, fallback: string) => {
  const validationMessage = getFirstValidationError(error?.response?.data?.errors);
  if (validationMessage) return validationMessage;

  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  return fallback;
};

const feedbackClassName = (type: FeedbackState["type"]) =>
  type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

const fieldClassName =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function InvoicePublic() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [agree, setAgree] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<FeedbackState | null>(null);
  const [signatureFeedback, setSignatureFeedback] = useState<FeedbackState | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const [submissionSaving, setSubmissionSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerProfileFormValues>(
    createCustomerProfileForm(),
  );

  useEffect(() => {
    if (!token) return;

    setPageMessage(null);
    setSubmissionFeedback(null);
    setSignatureFeedback(null);
    setProfileFeedback(null);
    setConfirmSaveOpen(false);
    void fetchInvoice(token, true);
  }, [token]);

  const fetchInvoice = async (tokenValue: string, syncProfileForm = false) => {
    try {
      setLoading(true);
      const res = await axios.get<PublicInvoiceData>(`/api/invoices/public/${tokenValue}`);
      setData(res.data);
      if (syncProfileForm) {
        setProfileForm(createCustomerProfileForm(res.data.invoice?.customer));
      }
      setPageMessage(null);
    } catch (error: any) {
      setPageMessage(getErrorMessage(error, "Invoice not found"));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileTextChange = (field: ProfileTextField, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProfileSelection = (
    field: "available_documents" | "english_language_proficiencies",
    value: string,
  ) => {
    setProfileForm((prev) => {
      const currentValues = prev[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...prev, [field]: nextValues };
    });
  };

  const validateSignatureInputs = () => {
    if (!signatureName.trim()) {
      return "Signature name is required";
    }

    if (!agree) {
      return "You must agree to the terms";
    }

    if (!photo) {
      return "Photo upload is required";
    }

    return null;
  };

  const openSaveConfirmation = () => {
    if (!data?.invoice.customer || data.invoice.customer_profile_submitted_at) return;

    const signatureError = validateSignatureInputs();

    setProfileFeedback(null);
    setSignatureFeedback(null);
    setSubmissionFeedback(null);
    if (signatureError) {
      setSubmissionFeedback({ type: "error", text: signatureError });
      return;
    }
    setConfirmSaveOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!token) return;

    try {
      setProfileSaving(true);
      setProfileFeedback(null);

      const res = await axios.post<PublicInvoiceData>(
        `/api/invoices/public/${token}/customer-profile`,
        {
          academic_profile_ssc: profileForm.academic_profile_ssc.trim(),
          academic_profile_hsc: profileForm.academic_profile_hsc.trim(),
          academic_profile_bachelor: profileForm.academic_profile_bachelor.trim(),
          academic_profile_masters: profileForm.academic_profile_masters.trim(),
          study_gap: profileForm.study_gap.trim(),
          total_funds_for_applicant: profileForm.total_funds_for_applicant.trim(),
          total_funds_for_accompanying_members:
            profileForm.total_funds_for_accompanying_members.trim(),
          moving_abroad_member_count: profileForm.moving_abroad_member_count.trim()
            ? Number(profileForm.moving_abroad_member_count)
            : null,
          available_documents: profileForm.available_documents,
          english_language_proficiencies: profileForm.english_language_proficiencies,
        },
      );

      setData(res.data);
      setProfileForm(createCustomerProfileForm(res.data.invoice?.customer));
      setConfirmSaveOpen(false);
      setProfileFeedback({
        type: "success",
        text: "Profile saved successfully. It can no longer be edited from this secure link.",
      });
    } catch (error: any) {
      setConfirmSaveOpen(false);
      setProfileFeedback({
        type: "error",
        text: getErrorMessage(error, "Failed to save customer profile"),
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!token) return;

    const signatureError = validateSignatureInputs();
    if (signatureError) {
      setConfirmSaveOpen(false);
      setSubmissionFeedback({ type: "error", text: signatureError });
      return;
    }

    try {
      setSubmissionSaving(true);
      setSubmissionFeedback(null);

      const formData = new FormData();
      formData.append("academic_profile_ssc", profileForm.academic_profile_ssc.trim());
      formData.append("academic_profile_hsc", profileForm.academic_profile_hsc.trim());
      formData.append("academic_profile_bachelor", profileForm.academic_profile_bachelor.trim());
      formData.append("academic_profile_masters", profileForm.academic_profile_masters.trim());
      formData.append("study_gap", profileForm.study_gap.trim());
      formData.append(
        "total_funds_for_applicant",
        profileForm.total_funds_for_applicant.trim(),
      );
      formData.append(
        "total_funds_for_accompanying_members",
        profileForm.total_funds_for_accompanying_members.trim(),
      );
      if (profileForm.moving_abroad_member_count.trim()) {
        formData.append(
          "moving_abroad_member_count",
          profileForm.moving_abroad_member_count.trim(),
        );
      }
      profileForm.available_documents.forEach((value) => {
        formData.append("available_documents[]", value);
      });
      profileForm.english_language_proficiencies.forEach((value) => {
        formData.append("english_language_proficiencies[]", value);
      });
      formData.append("signature_name", signatureName.trim());
      formData.append("agree", agree ? "1" : "0");
      if (photo) {
        formData.append("photo", photo);
      }

      const res = await axios.post<PublicInvoiceData>(
        `/api/invoices/public/${token}/submit`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setData(res.data);
      setProfileForm(createCustomerProfileForm(res.data.invoice?.customer));
      setSignatureName("");
      setAgree(false);
      setPhoto(null);
      setConfirmSaveOpen(false);
      setProfileFeedback(null);
      setSignatureFeedback(null);
      setSubmissionFeedback({
        type: "success",
        text: "Student information, signature, and photo were submitted successfully. They can no longer be edited from this secure link.",
      });
    } catch (error: any) {
      setConfirmSaveOpen(false);
      setSubmissionFeedback({
        type: "error",
        text: getErrorMessage(error, "Failed to submit student details"),
      });
    } finally {
      setSubmissionSaving(false);
    }
  };

  const handleSign = async () => {
    if (!token) return;

    const signatureError = validateSignatureInputs();
    if (signatureError) {
      setSignatureFeedback({ type: "error", text: signatureError });
      return;
    }

    try {
      setSignatureSaving(true);
      const formData = new FormData();
      formData.append("signature_name", signatureName.trim());
      formData.append("agree", agree ? "1" : "0");
      formData.append("photo", photo);

      await axios.post(`/api/invoices/public/${token}/sign`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSignatureFeedback({
        type: "success",
        text: "Thank you. Your signature has been recorded.",
      });
      await fetchInvoice(token);
    } catch (error: any) {
      setSignatureFeedback({
        type: "error",
        text: getErrorMessage(error, "Failed to submit signature"),
      });
    } finally {
      setSignatureSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6 text-gray-500">{pageMessage || "Invoice not found"}</div>;
  }

  const { invoice } = data;
  const hasStudentSignature = Boolean(
    invoice.student_signed_at || invoice.student_signature_name || data.student_photo_url,
  );
  const isProfileLocked = Boolean(invoice.customer_profile_submitted_at);
  const showStudentInformation = invoice.show_student_information !== false;
  const discountAmount =
    invoice.discount_type === "percent"
      ? (Number(invoice.subtotal || 0) * Number(invoice.discount_value || 0)) / 100
      : Number(invoice.discount_value || 0);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <img src={data.logo_url} alt="Company Logo" className="mb-2 h-12" />
              <div className="max-w-2xl text-sm leading-6 text-slate-600">{data.header_text}</div>
            </div>
            <div className="text-sm text-slate-600 md:text-right">
              <div>Invoice: {invoice.invoice_number || "-"}</div>
              <div>Date: {formatDate(invoice.invoice_date)}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">Branch</div>
              <div className="mt-2">{invoice.branch?.name || "-"}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">Customer</div>
              <div className="mt-2">
                {invoice.customer?.first_name} {invoice.customer?.last_name}
              </div>
              <div>{invoice.customer?.email || "-"}</div>
              <div>{invoice.customer?.phone || "-"}</div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoice.items?.map((item) => (
                  <tr key={item.id ?? item.name ?? "line-item"}>
                    <td className="px-4 py-2">{item.name || "-"}</td>
                    <td className="px-4 py-2">${formatMoney(item.price)}</td>
                    <td className="px-4 py-2">${formatMoney(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-right text-sm text-slate-700">
            <div>Subtotal: ${formatMoney(invoice.subtotal)}</div>
            <div>Discount: -${formatMoney(discountAmount)}</div>
            <div className="text-lg font-semibold text-slate-900">
              Total: ${formatMoney(invoice.total)}
            </div>
          </div>

          {data.contract_download_url || data.no_refund_contract_download_url ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
              {data.contract_download_url ? (
                <div>
                  Contract:{" "}
                  <a
                    href={data.contract_download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 underline"
                  >
                    Download
                  </a>
                </div>
              ) : null}

              {data.no_refund_contract_download_url ? (
                <div>
                  No Refund Contract:{" "}
                  <a
                    href={data.no_refund_contract_download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 underline"
                  >
                    Download
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

        {showStudentInformation ? (
          invoice.customer ? (
          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            {profileFeedback ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${feedbackClassName(profileFeedback.type)}`}
              >
                {profileFeedback.text}
              </div>
            ) : null}

            {isProfileLocked ? (
              <CustomerProfileSummary
                profile={invoice.customer}
                title="Saved Student Information"
                subtitle="This information has already been submitted and can no longer be edited from this secure link."
                emptyMessage="No student information has been saved yet."
              />
            ) : (
              <div>
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Student Information</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Save this information only when everything is final. After saving once, it
                    cannot be edited again from this secure link.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <div className="mb-3 text-sm font-semibold text-slate-900">Academic Profile</div>
                    <div className="grid gap-4">
                      {academicProfileFields.map((field) => (
                        <label key={field.key} className="block">
                          <div className="mb-1 text-sm font-medium text-slate-700">{field.label}</div>
                          <textarea
                            rows={3}
                            value={profileForm[field.key]}
                            onChange={(e) => handleProfileTextChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            disabled={profileSaving}
                            className={fieldClassName}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-1 text-sm font-medium text-slate-700">Study Gap</div>
                      <input
                        type="text"
                        value={profileForm.study_gap}
                        onChange={(e) => handleProfileTextChange("study_gap", e.target.value)}
                        placeholder="Example: 1 year"
                        disabled={profileSaving}
                        className={fieldClassName}
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-sm font-medium text-slate-700">
                        Total Funds Being Shown for Applicant
                      </div>
                      <input
                        type="text"
                        value={profileForm.total_funds_for_applicant}
                        onChange={(e) =>
                          handleProfileTextChange("total_funds_for_applicant", e.target.value)
                        }
                        placeholder="Example: BDT 2,000,000"
                        disabled={profileSaving}
                        className={fieldClassName}
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-sm font-medium text-slate-700">
                        Total Funds Being Shown for Accompanying Members
                      </div>
                      <input
                        type="text"
                        value={profileForm.total_funds_for_accompanying_members}
                        onChange={(e) =>
                          handleProfileTextChange(
                            "total_funds_for_accompanying_members",
                            e.target.value,
                          )
                        }
                        placeholder="Example: BDT 500,000"
                        disabled={profileSaving}
                        className={fieldClassName}
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-sm font-medium text-slate-700">
                        Number of Members Who Will Be Moving Abroad
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={profileForm.moving_abroad_member_count}
                        onChange={(e) =>
                          handleProfileTextChange("moving_abroad_member_count", e.target.value)
                        }
                        placeholder="0"
                        disabled={profileSaving}
                        className={fieldClassName}
                      />
                    </label>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <div className="mb-3 text-sm font-semibold text-slate-900">
                        Documents Student Can Provide
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {DOCUMENT_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={profileForm.available_documents.includes(option.value)}
                              onChange={() =>
                                toggleProfileSelection("available_documents", option.value)
                              }
                              disabled={profileSaving}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-semibold text-slate-900">
                        English Language Proficiency
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ENGLISH_LANGUAGE_PROFICIENCY_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={profileForm.english_language_proficiencies.includes(
                                option.value,
                              )}
                              onChange={() =>
                                toggleProfileSelection(
                                  "english_language_proficiencies",
                                  option.value,
                                )
                              }
                              disabled={profileSaving}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                      Clicking save will show a confirmation. After the first save, editing will be
                      permanently disabled for this secure link.
                    </div>
                    <button
                      type="button"
                      onClick={openSaveConfirmation}
                      disabled={profileSaving}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {profileSaving ? "Saving..." : "Save Profile Details"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              This invoice is not linked to a customer record yet, so the student information form
              cannot be saved.
            </div>
          </div>
          )
        ) : null}

        {hasStudentSignature ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Signature</h2>
            {signatureFeedback ? (
              <div
                className={`mb-3 rounded-xl border px-4 py-3 text-sm ${feedbackClassName(signatureFeedback.type)}`}
              >
                {signatureFeedback.text}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <div className="font-semibold text-slate-900">Name</div>
                <div>{invoice.student_signature_name || "-"}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Signed At</div>
                <div>{formatDate(invoice.student_signed_at)}</div>
              </div>
            </div>
            {data.student_photo_url ? (
              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">Photo</div>
                <img
                  src={data.student_photo_url}
                  alt="Signature Photo"
                  className="w-full max-w-xs rounded-xl border border-slate-200"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Sign & Upload Photo</h2>
            {signatureFeedback ? (
              <div
                className={`mb-3 rounded-xl border px-4 py-3 text-sm ${feedbackClassName(signatureFeedback.type)}`}
              >
                {signatureFeedback.text}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Type your full name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className={fieldClassName}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-base"
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              I agree to the terms and conditions
            </label>
            <button
              type="button"
              onClick={handleSign}
              className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm leading-6 text-slate-500">
          {data.footer_text}
        </div>
      </div>

        {confirmSaveOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">Confirm One-Time Save</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This profile can be saved only once. After you continue, the student will not be
                able to edit these details again from this secure link.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmSaveOpen(false)}
                  disabled={profileSaving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {profileSaving ? "Saving..." : "Save Once"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
