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

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value?: number | string | null) => `$${formatMoney(value)}`;

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
  const [submissionSaving, setSubmissionSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerProfileFormValues>(
    createCustomerProfileForm(),
  );

  useEffect(() => {
    if (!token) return;

    setPageMessage(null);
    setSubmissionFeedback(null);
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
    if (!data?.invoice.customer) {
      setSubmissionFeedback({
        type: "error",
        text: "No customer is linked to this invoice.",
      });
      return;
    }

    if (data.invoice.customer_profile_submitted_at || data.invoice.student_signed_at) return;

    const signatureError = validateSignatureInputs();

    setSubmissionFeedback(null);
    if (signatureError) {
      setSubmissionFeedback({ type: "error", text: signatureError });
      return;
    }
    setConfirmSaveOpen(true);
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
      const submittedEmail =
        res.data.invoice?.customer?.email || data?.invoice?.customer?.email || "your email";

      setData(res.data);
      setProfileForm(createCustomerProfileForm(res.data.invoice?.customer));
      setSignatureName("");
      setAgree(false);
      setPhoto(null);
      setConfirmSaveOpen(false);
      setSubmissionFeedback({
        type: "success",
        text: `Profile submitted successfully. This information is now permanently locked and can no longer be edited through this secure link. A copy of your receipt, signed contract, and profile information has been sent to your email: ${submittedEmail} for your records and future reference. Thanks again for choosing Connected Education`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
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
  const hasDiscount = discountAmount > 0;
  const customerName = `${invoice.customer?.first_name || ""} ${invoice.customer?.last_name || ""}`.trim() || "No customer assigned";
  const customerPhone = invoice.customer?.phone || "-";
  const customerEmail = invoice.customer?.email || "-";
  const workspaceNote = (data.header_text || "").trim();
  const showWorkspaceNote = workspaceNote.length > 0 && workspaceNote.toLowerCase() !== "connected invoice";
  const headerGridClassName = showWorkspaceNote
    ? "grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)_240px] lg:items-center"
    : "grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center";
  const invoiceSummaryRows = [
    { label: "Invoice Number", value: invoice.invoice_number || "-" },
    { label: "Invoice Date", value: formatDisplayDate(invoice.invoice_date) },
    { label: "Branch", value: invoice.branch?.name || "-" },
  ];
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {submissionFeedback ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${feedbackClassName(submissionFeedback.type)}`}
          >
            {submissionFeedback.text}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.16),_transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-6 py-7 sm:px-8 lg:px-10 lg:py-8">
            <div className={headerGridClassName}>
              <div className="flex min-h-[112px] items-center justify-center lg:justify-start">
                <img
                  src={data.logo_url}
                  alt="Company Logo"
                  className="max-h-[110px] w-auto object-contain"
                />
              </div>

              {showWorkspaceNote ? (
                <div className="flex min-h-[112px] items-center justify-center text-center">
                  <div className="w-full max-w-[320px] rounded-[24px] border border-slate-200 bg-white/80 px-5 py-4 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
                    {workspaceNote}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col items-center gap-3 text-center lg:items-end lg:text-right">
                <div className="text-xl font-light tracking-[0.08em] text-slate-800 sm:text-2xl">
                  INVOICE
                </div>

                <div className="space-y-1 text-xs text-slate-700 sm:text-sm">
                  <div>{invoice.branch?.name ? `${invoice.branch.name} Branch` : "Invoice workspace"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-b border-slate-200 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-10">
            <div className="space-y-3 text-slate-700">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Bill To
              </div>
              <div className="text-base font-semibold text-slate-900">{customerName}</div>
              <div className="text-sm">{customerPhone}</div>
              <div className="break-all text-sm">{customerEmail}</div>
            </div>

            <div className="w-full max-w-[340px] lg:justify-self-end">
              <div className="space-y-2 text-xs text-slate-700 sm:text-sm">
                {invoiceSummaryRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[124px_minmax(0,1fr)] items-start gap-x-6">
                    <span className="font-semibold text-slate-900">{row.label}:</span>
                    <span className="text-right tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-[170px]" />
              </colgroup>

              <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 sm:px-8 lg:px-10">Services / Items</th>
                  <th className="px-6 py-3.5 text-right sm:px-8 lg:px-10">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id ?? item.name ?? "line-item"} className="align-top">
                      <td className="px-6 py-3.5 sm:px-8 lg:px-10">
                        <div className="text-sm font-medium leading-6 text-slate-900">
                          {item.name || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm font-semibold text-slate-900 sm:px-8 lg:px-10">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-500 sm:px-8 lg:px-10">
                      No services have been added to this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-6 py-5 sm:px-8 lg:px-10">
            <div className="ml-auto w-full max-w-[340px]">
              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Subtotal</span>
                  <span className="block w-full text-right tabular-nums">{formatCurrency(invoice.subtotal)}</span>
                </div>

                {hasDiscount ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {invoice.discount_type === "percent" && Number(invoice.discount_value || 0) > 0
                        ? `Discount (${Number(invoice.discount_value)}%)`
                        : "Discount"}
                    </span>
                    <span className="block w-full text-right tabular-nums">-{formatCurrency(discountAmount)}</span>
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 bg-slate-100 py-3 text-sm">
                  <span className="font-semibold text-slate-900">Total:</span>
                  <span className="block w-full text-right text-lg font-semibold leading-none tabular-nums text-slate-900">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {data.contract_download_url || data.no_refund_contract_download_url ? (
            <div className="border-t border-slate-200 px-6 py-5 sm:px-8 lg:px-10">
              <div className="rounded-[24px] border border-slate-300 bg-slate-50/70 p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  {data.contract_download_url ? (
                    <a
                      href={data.contract_download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      Contract: Download
                    </a>
                  ) : null}

                  {data.no_refund_contract_download_url ? (
                    <a
                      href={data.no_refund_contract_download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      No Refund Contract: Download
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <div className="text-sm font-semibold text-slate-900">Important Review:</div>
                  <p>
                    Please carefully review the attached service contract before proceeding. This
                    document outlines all terms, conditions, responsibilities, and policies
                    governing your purchase.
                  </p>
                  <p>
                    You must read the refund conditions carefully. It is essential that you
                    understand and agree to these terms to ensure transparency and prevent future
                    conflicts. If you have any questions, make sure to ask your counsellor before
                    proceeding.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {showStudentInformation ? (
          invoice.customer ? (
          <div className="space-y-4">
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
                    Review this information carefully before final submission. Once you confirm and
                    submit, it cannot be edited again from this secure link.
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
                            disabled={submissionSaving}
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
                        disabled={submissionSaving}
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
                        disabled={submissionSaving}
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
                        disabled={submissionSaving}
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
                        disabled={submissionSaving}
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
                              disabled={submissionSaving}
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
                              disabled={submissionSaving}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-500">
                    <div>
                      Mandatory Review: Please carefully verify all information before submission.
                      This profile will be used to evaluate your academic background, financial
                      capacity, eligibility, and study preferences in order to provide tailored
                      counselling and application guidance. It is essential that all information is
                      accurate and complete. Once submitted, these details will be permanently
                      locked and cannot be changed or edited by you or by Connected Education,
                      ensuring full transparency and preserving the integrity of the information
                      submitted.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-slate-200 pt-6">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Type your full name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={submissionSaving}
                className={fieldClassName}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                disabled={submissionSaving}
                className="rounded-xl border border-slate-300 px-3 py-2 text-base disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                disabled={submissionSaving}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              I agree to the terms and conditions
            </label>
            {agree ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
                I confirm that I have carefully reviewed the contract, verified all submitted
                student information, and understand that my typed name and uploaded photo of
                myself constitute my official signature and agreement to proceed with Connected
                Education's services under the outlined terms and conditions.
              </div>
            ) : null}
            <button
              type="button"
              onClick={openSaveConfirmation}
              disabled={submissionSaving}
              className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submissionSaving ? "Submitting..." : "Confirm & Submit"}
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
              <h3 className="text-lg font-semibold text-slate-900">Confirm & Submit</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Please confirm that you have carefully reviewed your contract and all submitted
                student information before proceeding. Once submitted, these details will be
                permanently locked and cannot be edited, modified, or changed by either you or
                Connected Education. This is to ensure full transparency and preserve the
                integrity of your submitted profile.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmSaveOpen(false)}
                  disabled={submissionSaving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Go Back & Review
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={submissionSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submissionSaving ? "Submitting..." : "Confirm & Submit"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
