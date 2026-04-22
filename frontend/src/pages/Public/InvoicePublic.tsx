import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Check, Download, TriangleAlert } from "lucide-react";
import RichTextContent from "../../components/common/RichTextContent";
import CustomerProfileSummary from "../../components/invoices/CustomerProfileSummary";
import {
  createCustomerProfileForm,
  CustomerProfileFormValues,
  CustomerProfileSnapshot,
  CUSTOMER_PROFILE_FORM_FIELDS,
  getFirstValidationError,
  LEVEL_OF_STUDY_OPTIONS,
  PREFERRED_INTAKE_OPTIONS,
  STUDY_COUNTRY_OPTIONS,
  YES_NO_CONFUSED_OPTIONS,
  YES_NO_NOT_APPLICABLE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils/customerProfile";
import { getDisplayReceiptNumber } from "../../utils/invoiceNumber";

interface InvoiceCustomer extends CustomerProfileSnapshot {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface InvoiceLineItem {
  id?: number | string;
  name?: string | null;
  description?: string | null;
  receipt_description?: string | null;
  price?: number | string | null;
  line_total?: number | string | null;
}

interface PublicInvoice {
  invoice_number?: string | null;
  display_invoice_number?: string | null;
  invoice_date?: string | null;
  status?: string | null;
  payment_method?: string | null;
  subtotal?: number | string | null;
  total?: number | string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  customer_profile_submitted_at?: string | null;
  student_signed_at?: string | null;
  student_signature_name?: string | null;
  student_nid?: string | null;
  student_signature_ip?: string | null;
  show_student_information?: boolean | null;
  show_no_refund_contract?: boolean | null;
  branch?: { name?: string | null; full_address?: string | null } | null;
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
  student_nid_url?: string | null;
  counsellor_approval_evidence_url?: string | null;
  message?: string;
}

interface FeedbackState {
  type: "success" | "error";
  text: string;
}

interface SelectOption {
  value: string;
  label: string;
}

type ProfileField = keyof CustomerProfileFormValues;

// ─── Field error map ──────────────────────────────────────────────────────────
type FieldErrors = Partial<Record<ProfileField | "signature_name" | "agree" | "photo" | "nid_file" | "counsellor_approval_evidence", string>>;

const academicProfileFields: Array<{
  key: Extract<
    ProfileField,
    | "academic_profile_ssc"
    | "academic_profile_hsc"
    | "academic_profile_bachelor"
    | "academic_profile_masters"
  >;
  label: string;
  required: boolean;
}> = [
  { key: "academic_profile_ssc", label: "SSC or O Level", required: true },
  { key: "academic_profile_hsc", label: "HSC or A Level", required: true },
  { key: "academic_profile_bachelor", label: "Bachelor", required: false },
  { key: "academic_profile_masters", label: "Masters", required: false },
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

const formatCurrency = (value?: number | string | null) => `${formatMoney(value)} BDT`;

const formatPaymentMethod = (value?: string | null) => {
  if (!value) return "Not set";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeDownloadUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
  }
};

const IMAGE_FILE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const MAX_UPLOAD_SIZE_MB = 4;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = `${MAX_UPLOAD_SIZE_MB} MB`;

const getFileExtension = (value?: string | null) => {
  if (!value) return "";

  const sanitizedValue = value.split("?")[0]?.split("#")[0]?.trim().toLowerCase() || "";
  const lastDotIndex = sanitizedValue.lastIndexOf(".");

  return lastDotIndex >= 0 ? sanitizedValue.slice(lastDotIndex + 1) : "";
};

const isImageFile = (...values: Array<string | null | undefined>) =>
  values.some((value) => IMAGE_FILE_EXTENSIONS.includes(getFileExtension(value)));

const getFileTooLargeMessage = (label: string) =>
  `${label} must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`;

const getFileSizeError = (file: File | null, label: string) => {
  if (!file) return undefined;
  return file.size > MAX_UPLOAD_SIZE_BYTES ? getFileTooLargeMessage(label) : undefined;
};

const getErrorMessage = (error: any, fallback: string) => {
  if (error?.response?.status === 413) {
    return `File size is too large. Each uploaded file must be ${MAX_UPLOAD_SIZE_LABEL} or smaller. Please reduce the file size and try again.`;
  }

  if (!error?.response) {
    return "Network connection lost. Please check your internet connection and try again. Make sure your file sizes are not too large.";
  }

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

const scrollToPageTop = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const fieldClassName = (hasError?: boolean) =>
  `w-full rounded-2xl border ${
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
  } bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <TriangleAlert size={9} />
      </span>
      {message}
    </p>
  );
}

function UploadedFilePreview({
  title,
  href,
  fileName,
  alt,
}: {
  title: string;
  href?: string | null;
  fileName?: string | null;
  alt: string;
}) {
  const normalizedHref = normalizeDownloadUrl(href);
  if (!normalizedHref) return null;

  const previewAsImage = isImageFile(href, fileName);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
      </div>

      {previewAsImage ? (
        <img
          src={normalizedHref}
          alt={alt}
          className="w-full max-w-xs rounded-xl border border-slate-200"
        />
      ) : (
        <div className="max-w-xs rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="font-medium text-slate-900">{fileName || "Uploaded file"}</div>
          <div className="mt-1">Preview is not available for this file type. Download it to review.</div>
        </div>
      )}
    </div>
  );
}

function SelectedFilePreview({
  title,
  file,
  alt,
}: {
  title: string;
  file: File | null;
  alt: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);

    return () => URL.revokeObjectURL(nextObjectUrl);
  }, [file]);

  if (!file || !objectUrl) return null;

  const previewAsImage = file.type.startsWith("image/") || isImageFile(file.name);

  return (
    <div className="mt-3">
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      {previewAsImage ? (
        <img
          src={objectUrl}
          alt={alt}
          className="w-full max-w-xs rounded-xl border border-slate-200"
        />
      ) : (
        <div className="max-w-xs rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="font-medium text-slate-900">{file.name}</div>
          <div className="mt-1">Preview is not available for this file type. It will be uploaded as selected.</div>
        </div>
      )}
    </div>
  );
}

function validateProfileFormFields(form: CustomerProfileFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const req = (field: ProfileField, value: string, label: string) => {
    if (!value.trim()) errors[field] = `${label} is required.`;
  };

  req("phone", form.phone, "Student Phone Number");
  req("email", form.email, "Student Email");
  req("emergency_contact_number", form.emergency_contact_number, "Emergency Contact Number");
  req("emergency_contact_relationship", form.emergency_contact_relationship, "Relationship with Emergency Contact");
  req("date_of_birth", form.date_of_birth, "Date of Birth");
  req("preferred_study_country_primary", form.preferred_study_country_primary, "First Priority Country");
  req("preferred_study_country_secondary", form.preferred_study_country_secondary, "Second Priority Country");
  req("preferred_intake", form.preferred_intake, "Preferred Intake");
  req("academic_profile_ssc", form.academic_profile_ssc, "SSC or O Level");
  req("academic_profile_hsc", form.academic_profile_hsc, "HSC or A Level");
  req("has_study_gap", form.has_study_gap, "Study gap answer");
  if (form.has_study_gap === "yes") {
    req("study_gap_details", form.study_gap_details, "Gap explanation details");
  }
  req("has_english_test_scores", form.has_english_test_scores, "English test score answer");
  if (form.has_english_test_scores === "yes") {
    req("english_test_score_details", form.english_test_score_details, "English test score");
  }
  if (form.has_english_test_scores === "no") {
    req("english_test_plan", form.english_test_plan, "Exam plan date");
  }
  req("intended_level_of_study", form.intended_level_of_study, "Intended Level of Study");
  req("max_tuition_budget_bdt", form.max_tuition_budget_bdt, "Maximum Budget for Tuition Fees");
  req("accompanying_member_status", form.accompanying_member_status, "Accompanying member answer");
  if (form.accompanying_member_status === "yes") {
    req("accompanying_member_details", form.accompanying_member_details, "Accompanying member details");
  }
  req("has_at_least_fifty_lacs_bank_statement", form.has_at_least_fifty_lacs_bank_statement, "Bank statement answer");
  if (form.has_at_least_fifty_lacs_bank_statement === "no" || form.has_at_least_fifty_lacs_bank_statement === "confused") {
    req("wants_connected_bank_loan_support", form.wants_connected_bank_loan_support, "Bank loan support answer");
  }
  req("grades_below_seventy_percent", form.grades_below_seventy_percent, "Grades below 70% answer");
  req("english_score_below_requirement", form.english_score_below_requirement, "English score below requirement answer");
  req("education_gap_exceeds_limit", form.education_gap_exceeds_limit, "Education gap answer");
  req("counsellor_discussed_complex_profile", form.counsellor_discussed_complex_profile, "Complex profile discussion answer");
  req("application_deadline_within_two_weeks", form.application_deadline_within_two_weeks, "Application deadline answer");
  req("has_missing_academic_documents", form.has_missing_academic_documents, "Missing documents answer");
  if (form.has_missing_academic_documents === "yes") {
    req("missing_academic_documents_details", form.missing_academic_documents_details, "Missing document details");
  }
  req("reviewed_no_refund_consent", form.reviewed_no_refund_consent, "No refund consent answer");

  return errors;
}

function getCounsellorApprovalEvidenceError(
  form: CustomerProfileFormValues,
  file: File | null,
): string | undefined {
  const fileSizeError = getFileSizeError(file, "Counsellor approval evidence");
  if (fileSizeError) {
    return fileSizeError;
  }

  if (
    form.counsellor_discussed_complex_profile === "yes"
    && !file
  ) {
    return "Counsellor approval evidence is required when counsellor mentioned complex academic profile.";
  }

  return undefined;
}

function validateSignatureFields({
  signatureName,
  agree,
  photo,
  nidFile,
}: {
  signatureName: string;
  agree: boolean;
  photo: File | null;
  nidFile: File | null;
}): Pick<FieldErrors, "signature_name" | "agree" | "photo" | "nid_file"> {
  const errors: Pick<FieldErrors, "signature_name" | "agree" | "photo" | "nid_file"> = {};
  if (!signatureName.trim()) errors.signature_name = "Full name (signature) is required.";
  if (!agree) errors.agree = "You must agree to the terms and conditions.";
  if (!photo) errors.photo = "A selfie photo upload is required.";
  const photoSizeError = getFileSizeError(photo, "Selfie photo");
  if (photoSizeError) errors.photo = photoSizeError;
  if (!nidFile) errors.nid_file = "National ID file upload is required.";
  const nidSizeError = getFileSizeError(nidFile, "National ID file");
  if (nidSizeError) errors.nid_file = nidSizeError;
  return errors;
}

function getFirstFieldErrorMessage(errors: FieldErrors): string {
  const firstMessage = Object.values(errors).find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  return firstMessage || "Please review the highlighted fields before submitting.";
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="mb-2 text-sm font-medium text-slate-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  required,
  error,
  fieldRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  fieldRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <input
        ref={fieldRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={fieldClassName(!!error)}
      />
      <FieldError message={error} />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  required,
  error,
  fieldRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  required?: boolean;
  error?: string;
  fieldRef?: React.Ref<HTMLTextAreaElement>;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <textarea
        ref={fieldRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={fieldClassName(!!error)}
      />
      <FieldError message={error} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled,
  required,
  error,
  fieldRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  fieldRef?: React.Ref<HTMLSelectElement>;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <select
        ref={fieldRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={fieldClassName(!!error)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </label>
  );
}

function ChoiceField({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
  error,
  fieldRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  error?: string;
  fieldRef?: React.Ref<HTMLDivElement>;
}) {
  const groupName =
    label.trim() !== ""
      ? `choice-${label.replace(/\s+/g, "-").toLowerCase()}`
      : `choice-${options.map((o) => o.value).join("-")}`;

  return (
    <div className="block" ref={fieldRef}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`inline-flex max-w-full cursor-pointer items-center gap-3 rounded-[16px] border-2 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                checked
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[0_16px_35px_-22px_rgba(16,185,129,0.75)]"
                  : error
                  ? "border-rose-300 bg-rose-50/60 text-slate-700 hover:border-rose-400"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name={groupName}
                checked={checked}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  checked
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-transparent"
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </span>
              <span className="truncate leading-none">{option.label}</span>
            </label>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function TickboxField({
  label,
  checked,
  onChange,
  disabled,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label
        className={`inline-flex max-w-full cursor-pointer items-center gap-3 rounded-[16px] border-2 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
          checked
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[0_16px_35px_-22px_rgba(16,185,129,0.75)]"
            : error
            ? "border-rose-300 bg-rose-50/60 text-slate-700 hover:border-rose-400"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span
          className={`flex h-4 w-4 items-center justify-center rounded border ${
            checked
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          <Check size={11} strokeWidth={3} />
        </span>
        <span className="truncate leading-none">{label}</span>
      </label>
      <FieldError message={error} />
    </div>
  );
}

function FileUploadField({
  label,
  file,
  onChange,
  disabled,
  required,
  error,
  fieldRef,
  accept = "image/*,.pdf",
  hint,
  inputId,
  previewTitle,
  previewAlt,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  fieldRef?: React.Ref<HTMLDivElement>;
  accept?: string;
  hint?: string;
  inputId: string;
  previewTitle?: string;
  previewAlt?: string;
}) {
  return (
    <div ref={fieldRef}>
      <FieldLabel label={label} required={required} />
      {hint ? <p className="mb-2 text-xs text-slate-500">{hint}</p> : null}
      <label
        htmlFor={inputId}
        className={`flex min-h-[52px] w-full cursor-pointer items-center rounded-2xl border px-3 py-2 text-sm transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            : error
            ? "border-rose-400 bg-rose-50/40 text-slate-700 hover:border-rose-500"
            : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60"
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          disabled={disabled}
          className="sr-only"
        />
        <span className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 font-medium text-slate-700">
          Choose File
        </span>
        <span className={`ml-3 truncate ${file ? "text-slate-700" : "text-slate-500"}`}>
          {file?.name || "No file chosen"}
        </span>
      </label>
      <FieldError message={error} />
      <SelectedFilePreview
        title={previewTitle || label}
        file={file}
        alt={previewAlt || label}
      />
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function InvoicePublic() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [counsellorApprovalEvidence, setCounsellorApprovalEvidence] = useState<File | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<FeedbackState | null>(null);
  const [submissionSaving, setSubmissionSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerProfileFormValues>(
    createCustomerProfileForm(),
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fieldRefs = useRef<Partial<Record<keyof FieldErrors, HTMLElement | null>>>({});

  const setFieldRef = (key: keyof FieldErrors) => (el: HTMLElement | null) => {
    fieldRefs.current[key] = el;
  };

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
      const defaultSignatureName =
        res.data.invoice?.student_signature_name?.trim() ||
        `${res.data.invoice?.customer?.first_name || ""} ${res.data.invoice?.customer?.last_name || ""}`.trim();
      setSignatureName(defaultSignatureName);
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

  const handleProfileFieldChange = (field: ProfileField, value: string) => {
    const nextProfileForm = { ...profileForm, [field]: value };
    const clearsCounsellorApprovalEvidenceError =
      fieldErrors.counsellor_approval_evidence
      && !(
        nextProfileForm.counsellor_discussed_complex_profile === "yes"
      );

    setProfileForm(nextProfileForm);
    if (fieldErrors[field] || clearsCounsellorApprovalEvidenceError) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (clearsCounsellorApprovalEvidenceError) {
          delete next.counsellor_approval_evidence;
        }
        return next;
      });
    }
  };

  const setFileFieldError = (
    key: "photo" | "nid_file" | "counsellor_approval_evidence",
    message?: string,
  ) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const applyValidatedFileSelection = (
    key: "photo" | "nid_file" | "counsellor_approval_evidence",
    label: string,
    file: File | null,
    assign: (nextFile: File | null) => void,
  ) => {
    const fileSizeError = getFileSizeError(file, label);
    if (fileSizeError) {
      assign(null);
      setFileFieldError(key, fileSizeError);
      return;
    }

    assign(file);
    if (file) {
      setFileFieldError(key, undefined);
    }
  };

  const handleCounsellorApprovalEvidenceChange = (file: File | null) => {
    applyValidatedFileSelection(
      "counsellor_approval_evidence",
      "Counsellor approval evidence",
      file,
      setCounsellorApprovalEvidence,
    );
  };

  const scrollToFirstError = (errors: FieldErrors) => {
    const keys = Object.keys(errors) as Array<keyof FieldErrors>;
    for (const key of keys) {
      const el = fieldRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in el && typeof el.focus === "function") {
          (el as HTMLElement).focus({ preventScroll: true });
        }
        return true;
      }
    }

    return false;
  };

  const shouldValidateProfileForm = data?.invoice?.show_student_information !== false;

  const openSaveConfirmation = () => {
    if (!data?.invoice.customer) {
      setSubmissionFeedback({ type: "error", text: "No customer is linked to this invoice." });
      scrollToPageTop();
      return;
    }
    if (data.invoice.customer_profile_submitted_at || data.invoice.student_signed_at) {
      setSubmissionFeedback({
        type: "error",
        text: "Student details have already been submitted and cannot be edited again.",
      });
      scrollToPageTop();
      return;
    }

    setSubmissionFeedback(null);
    let allErrors: FieldErrors = {};
    if (shouldValidateProfileForm) {
      allErrors = { ...allErrors, ...validateProfileFormFields(profileForm) };
      const counsellorApprovalEvidenceError = getCounsellorApprovalEvidenceError(
        profileForm,
        counsellorApprovalEvidence,
      );
      if (counsellorApprovalEvidenceError) {
        allErrors.counsellor_approval_evidence = counsellorApprovalEvidenceError;
      }
    }
    const sigErrors = validateSignatureFields({ signatureName, agree, photo, nidFile });
    allErrors = { ...allErrors, ...sigErrors };

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setTimeout(() => {
        const focused = scrollToFirstError(allErrors);
        if (!focused) {
          setSubmissionFeedback({
            type: "error",
            text: getFirstFieldErrorMessage(allErrors),
          });
          scrollToPageTop();
        }
      }, 50);
      return;
    }
    setFieldErrors({});
    setConfirmSaveOpen(true);
  };

  const handleSubmitAll = async () => {
    if (!token) {
      setSubmissionFeedback({
        type: "error",
        text: "Invalid invoice link. Please check the URL and try again.",
      });
      scrollToPageTop();
      return;
    }

    let allErrors: FieldErrors = {};
    if (shouldValidateProfileForm) {
      allErrors = { ...allErrors, ...validateProfileFormFields(profileForm) };
      const counsellorApprovalEvidenceError = getCounsellorApprovalEvidenceError(
        profileForm,
        counsellorApprovalEvidence,
      );
      if (counsellorApprovalEvidenceError) {
        allErrors.counsellor_approval_evidence = counsellorApprovalEvidenceError;
      }
    }
    const sigErrors = validateSignatureFields({ signatureName, agree, photo, nidFile });
    allErrors = { ...allErrors, ...sigErrors };

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setConfirmSaveOpen(false);
      setTimeout(() => {
        const focused = scrollToFirstError(allErrors);
        if (!focused) {
          setSubmissionFeedback({
            type: "error",
            text: getFirstFieldErrorMessage(allErrors),
          });
          scrollToPageTop();
        }
      }, 50);
      return;
    }

    try {
      setSubmissionSaving(true);
      setSubmissionFeedback(null);

      const formData = new FormData();
      if (shouldValidateProfileForm) {
        CUSTOMER_PROFILE_FORM_FIELDS.forEach((field) => {
          formData.append(field, profileForm[field].trim());
        });
      }
      formData.append("signature_name", signatureName.trim());
      if (nidFile) formData.append("nid", nidFile);
      formData.append("agree", agree ? "1" : "0");
      if (photo) formData.append("photo", photo);
      if (needsCounsellorApprovalEvidence && counsellorApprovalEvidence) {
        formData.append("counsellor_approval_evidence", counsellorApprovalEvidence);
      }

      const res = await axios.post<PublicInvoiceData>(
        `/api/invoices/public/${token}/submit`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const submittedEmail =
        res.data.invoice?.customer?.email || data?.invoice?.customer?.email || "your email";
      const successPrefix = shouldValidateProfileForm
        ? "Profile submitted successfully."
        : "Signature submitted successfully.";
      const sentDocumentsLabel = shouldValidateProfileForm
        ? "receipt, signed contract, and profile information"
        : "receipt and signed contract";

      setData(res.data);
      setProfileForm(createCustomerProfileForm(res.data.invoice?.customer));
      setSignatureName("");
      setNidFile(null);
      setAgree(false);
      setPhoto(null);
      setCounsellorApprovalEvidence(null);
      setConfirmSaveOpen(false);
      setFieldErrors({});
      setSubmissionFeedback({
        type: "success",
        text: `${successPrefix} This submission is now permanently locked and can no longer be edited through this secure link. A copy of your ${sentDocumentsLabel} has been sent to your email: ${submittedEmail} for your records and future reference. Thanks again for choosing Connected Education`,
      });
      scrollToPageTop();
    } catch (error: any) {
      setConfirmSaveOpen(false);
      setSubmissionFeedback({
        type: "error",
        text: getErrorMessage(error, "Failed to submit student details"),
      });
      scrollToPageTop();
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
    invoice.student_signed_at || invoice.student_signature_name || data.student_photo_url || data.student_nid_url,
  );
  const isProfileLocked = Boolean(invoice.customer_profile_submitted_at);
  const showStudentInformation = invoice.show_student_information !== false;
  const showNoRefundContract = invoice.show_no_refund_contract === true;
  const discountAmount =
    invoice.discount_type === "percent"
      ? (Number(invoice.subtotal || 0) * Number(invoice.discount_value || 0)) / 100
      : Number(invoice.discount_value || 0);
  const hasDiscount = discountAmount > 0;
  const customerName =
    `${invoice.customer?.first_name || ""} ${invoice.customer?.last_name || ""}`.trim() ||
    "No customer assigned";
  const customerPhone = invoice.customer?.phone || "-";
  const customerEmail = invoice.customer?.email || "-";
  const workspaceNote = (data.header_text || "").trim();
  const showWorkspaceNote =
    workspaceNote.length > 0 && workspaceNote.toLowerCase() !== "connected invoice";
  const headerGridClassName = showWorkspaceNote
    ? "grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)_240px] lg:items-center"
    : "grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center";
  const isApproved = invoice.status === "approved";
  const contractDownloadUrl = normalizeDownloadUrl(data.contract_download_url);
  const noRefundContractDownloadUrl = normalizeDownloadUrl(data.no_refund_contract_download_url);
  const receiptNumber = getDisplayReceiptNumber(
    invoice.invoice_number,
    invoice.display_invoice_number,
  );
  const invoiceSummaryRows = [
    { label: "Receipt Number", value: receiptNumber },
    { label: "Payment Date", value: formatDisplayDate(invoice.invoice_date) },
    { label: "Payment Method", value: formatPaymentMethod(invoice.payment_method) },
    ...(isApproved ? [{ label: "Payment Status", value: "Paid" }] : []),
  ];
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const hasStudyGap = profileForm.has_study_gap === "yes";
  const needsCounsellorApprovalEvidence =
    profileForm.counsellor_discussed_complex_profile === "yes";
  const hasEnglishScores = profileForm.has_english_test_scores === "yes";
  const hasNoEnglishScores = profileForm.has_english_test_scores === "no";
  const hasAccompanyingMembers = profileForm.accompanying_member_status === "yes";
  const needsBankLoanSupport = profileForm.has_at_least_fifty_lacs_bank_statement === "no" || profileForm.has_at_least_fifty_lacs_bank_statement === "confused";
  const hasMissingDocuments = profileForm.has_missing_academic_documents === "yes";
  const confirmSubmitDescription = showStudentInformation
    ? "Please confirm that you have carefully reviewed your contract and all submitted student information before proceeding. Once submitted, these details will be permanently locked and cannot be edited, modified, or changed by either you or Connected Education. This is to ensure full transparency and preserve the integrity of your submitted profile."
    : "Please confirm that you have carefully reviewed your contract before proceeding. Once submitted, your signature details will be permanently locked and cannot be edited, modified, or changed by either you or Connected Education.";
  const signatureConfirmationText = showStudentInformation
    ? "I confirm that I have carefully reviewed the contract, verified all submitted student information, and understand that my typed name and uploaded photo of myself constitute my official signature and agreement to proceed with Connected Education's services under the outlined terms and conditions."
    : "I confirm that I have carefully reviewed the contract and understand that my typed name and uploaded photo of myself constitute my official signature and agreement to proceed with Connected Education's services under the outlined terms and conditions.";

  // ─── Invoice card ─────────────────────────────────────────────────────────

  const invoiceCard = (
    <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.16),_transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-6 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8">

        {/* ── Mobile header (hidden on lg+) ── */}
        <div className="lg:hidden">
          <div className="shrink-0">
            <img
              src={data.logo_url}
              alt="Company Logo"
              className="max-h-[44px] w-auto max-w-[120px] object-contain"
            />
            <div className="mt-1.5 text-sm font-light tracking-widest text-slate-700">
              Receipt
            </div>
            {(invoice.branch?.name || invoice.branch?.full_address) && (
              <div className="mt-1.5">
                {invoice.branch?.name && (
                  <div className="text-sm font-medium text-slate-700">{invoice.branch.name}</div>
                )}
                {invoice.branch?.full_address && (
                  <div className="mt-0.5 text-xs leading-5 text-slate-500 break-words">
                    {invoice.branch.full_address}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Workspace note below */}
          {showWorkspaceNote ? (
            <div className="mt-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
                {workspaceNote}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Desktop header (hidden below lg) ── */}
        <div className={`hidden lg:grid ${headerGridClassName}`}>
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
              Receipt
            </div>
            <div className="space-y-1 text-xs text-slate-700 sm:text-sm">
              <div>
                {invoice.branch?.name ? `${invoice.branch.name} Branch` : "Invoice workspace"}
              </div>
              {invoice.branch?.full_address ? (
                <div className="text-xs text-slate-600 leading-5">{invoice.branch.full_address}</div>
              ) : null}
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
              <div
                key={row.label}
                className="grid grid-cols-[124px_minmax(0,1fr)] items-start gap-x-6"
              >
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
              <th className="px-6 py-3.5 sm:px-8 lg:px-10">Service Type</th>
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
                    {item.receipt_description && (
                      <div className="mt-2 space-y-2 text-xs leading-5 text-slate-500">
                        <div>
                          <div className="font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Description
                          </div>
                          <RichTextContent
                            html={item.receipt_description}
                            className="mt-1"
                            compact
                          />
                        </div>
                      </div>
                    )}
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
              <span className="block w-full text-right tabular-nums">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {hasDiscount ? (
              <div className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-6 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {invoice.discount_type === "percent" && Number(invoice.discount_value || 0) > 0
                    ? `Discount (${Number(invoice.discount_value)}%)`
                    : "Discount"}
                </span>
                <span className="block w-full text-right tabular-nums">
                  -{formatCurrency(discountAmount)}
                </span>
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

      {showNoRefundContract && (contractDownloadUrl || noRefundContractDownloadUrl) ? (
        <div className="border-t border-slate-200 px-6 py-5 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[28px] border border-rose-300 bg-[radial-gradient(circle_at_top_right,_rgba(251,113,133,0.28),_transparent_32%),linear-gradient(135deg,rgba(255,241,242,0.98),rgba(255,255,255,1))] p-5 shadow-[0_0_0_1px_rgba(244,63,94,0.12),0_24px_55px_-30px_rgba(190,24,93,0.48),0_0_44px_rgba(251,113,133,0.24)] sm:p-6">
            <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-rose-300/40 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-700 shadow-[0_0_24px_rgba(244,63,94,0.22)]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
                <TriangleAlert size={14} />
                Important Download
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-rose-950">
                <h4 className="text-lg font-semibold text-rose-900">Important Review:</h4>
                <p>
                  Please carefully review the attached service contract before proceeding. This
                  document outlines all terms, conditions, responsibilities, and policies governing
                  your purchase. You must read the refund conditions carefully. It is essential that
                  you understand and agree to these terms to ensure transparency and prevent future
                  conflicts. If you have any questions, make sure to ask your counsellor before
                  proceeding.
                </p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {contractDownloadUrl ? (
                  <a
                    href={contractDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="group relative overflow-hidden rounded-[22px] border border-rose-300 bg-white/90 px-5 py-4 text-left text-rose-900 shadow-[0_0_0_1px_rgba(244,63,94,0.1),0_0_36px_rgba(244,63,94,0.22)] transition duration-200 hover:-translate-y-1 hover:border-rose-400 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_48px_rgba(244,63,94,0.34)]"
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.2),_transparent_55%)] opacity-80 transition duration-200 group-hover:opacity-100" />
                    <span className="relative flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-[0_0_24px_rgba(244,63,94,0.5)]">
                        <Download size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold">Contract: Download</span>
                        <span className="mt-1 block text-sm leading-5 text-rose-700">
                          Required download. Save this important contract before proceeding.
                        </span>
                      </span>
                    </span>
                  </a>
                ) : null}
                {noRefundContractDownloadUrl ? (
                  <a
                    href={noRefundContractDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="group relative overflow-hidden rounded-[22px] border border-rose-300 bg-white/90 px-5 py-4 text-left text-rose-900 shadow-[0_0_0_1px_rgba(244,63,94,0.1),0_0_36px_rgba(244,63,94,0.22)] transition duration-200 hover:-translate-y-1 hover:border-rose-400 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_48px_rgba(244,63,94,0.34)]"
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.2),_transparent_55%)] opacity-80 transition duration-200 group-hover:opacity-100" />
                    <span className="relative flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-[0_0_24px_rgba(244,63,94,0.5)]">
                        <Download size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold">
                          No Refund Contract: Download
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-rose-700">
                          Required download. This file is important and must be reviewed carefully.
                        </span>
                      </span>
                    </span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );

  // ─── Student info card ────────────────────────────────────────────────────

  const studentInfoCard = (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {showStudentInformation ? (
        invoice.customer ? (
          <div className="space-y-4">
            {isProfileLocked ? (
              <CustomerProfileSummary
                profile={invoice.customer}
                title="Profile Agreement for the Client"
                subtitle="This information has already been submitted and can no longer be edited from this secure link."
                emptyMessage="No student information has been saved yet."
                alwaysShowContent
                hasSubmittedAgreement
                renderOptionAnswersAsCheckboxes
                enableDarkMode={false}
                counsellorApprovalEvidenceUrl={data.counsellor_approval_evidence_url}
              />
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Profile Agreement for the Client
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    This section ensures that all details regarding your profile are accurately
                    represented and mutually understood. It&apos;s extremely important that you fill
                    this section accurately.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Fields marked with <span className="text-rose-500 font-semibold">*</span> are required.
                  </p>
                </div>

                <FormSection title="Student Contact Details">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Student Phone Number"
                      value={profileForm.phone}
                      onChange={(value) => handleProfileFieldChange("phone", value)}
                      placeholder="Enter student phone number"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.phone}
                      fieldRef={setFieldRef("phone") as React.Ref<HTMLInputElement>}
                    />
                    <InputField
                      label="Student Email"
                      value={profileForm.email}
                      onChange={(value) => handleProfileFieldChange("email", value)}
                      placeholder="Enter student email"
                      type="email"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.email}
                      fieldRef={setFieldRef("email") as React.Ref<HTMLInputElement>}
                    />
                    <InputField
                      label="Emergency Contact Number"
                      value={profileForm.emergency_contact_number}
                      onChange={(value) => handleProfileFieldChange("emergency_contact_number", value)}
                      placeholder="Enter emergency contact number"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.emergency_contact_number}
                      fieldRef={setFieldRef("emergency_contact_number") as React.Ref<HTMLInputElement>}
                    />
                    <InputField
                      label="Relationship with Emergency Contact Number"
                      value={profileForm.emergency_contact_relationship}
                      onChange={(value) => handleProfileFieldChange("emergency_contact_relationship", value)}
                      placeholder="Example: Father, Mother, Brother"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.emergency_contact_relationship}
                      fieldRef={setFieldRef("emergency_contact_relationship") as React.Ref<HTMLInputElement>}
                    />
                    <InputField
                      label="Date of Birth"
                      value={profileForm.date_of_birth}
                      onChange={(value) => handleProfileFieldChange("date_of_birth", value)}
                      type="date"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.date_of_birth}
                      fieldRef={setFieldRef("date_of_birth") as React.Ref<HTMLInputElement>}
                    />
                  </div>
                </FormSection>

                <FormSection title="Study Preferences">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Your Preferred Country to Study: First Priority"
                      value={profileForm.preferred_study_country_primary}
                      onChange={(value) => handleProfileFieldChange("preferred_study_country_primary", value)}
                      placeholder="e.g. Canada, Australia, UK"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.preferred_study_country_primary}
                      fieldRef={setFieldRef("preferred_study_country_primary") as React.Ref<HTMLInputElement>}
                    />
                    <InputField
                      label="Your Preferred Country to Study: Second Priority"
                      value={profileForm.preferred_study_country_secondary}
                      onChange={(value) => handleProfileFieldChange("preferred_study_country_secondary", value)}
                      placeholder="e.g. Canada, Australia, UK"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.preferred_study_country_secondary}
                      fieldRef={setFieldRef("preferred_study_country_secondary") as React.Ref<HTMLInputElement>}
                    />
                    <InputField
                      label="Your Preferred Intake"
                      value={profileForm.preferred_intake}
                      onChange={(value) => handleProfileFieldChange("preferred_intake", value)}
                      placeholder="e.g. January 2026, September 2026"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.preferred_intake}
                      fieldRef={setFieldRef("preferred_intake") as React.Ref<HTMLInputElement>}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Academic Background"
                  description="Mention grades, stream, and grading scale percentage where applicable."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {academicProfileFields.map((field) => (
                      <TextareaField
                        key={field.key}
                        label={field.label}
                        value={profileForm[field.key]}
                        onChange={(value) => handleProfileFieldChange(field.key, value)}
                        placeholder="Mention grades, stream, and grading scale percentage"
                        disabled={submissionSaving}
                        required={field.required}
                        error={fieldErrors[field.key]}
                        fieldRef={setFieldRef(field.key) as React.Ref<HTMLTextAreaElement>}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Gap Explanation">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChoiceField
                      label="Do you have any study gaps?"
                      value={profileForm.has_study_gap}
                      onChange={(value) => handleProfileFieldChange("has_study_gap", value)}
                      options={YES_NO_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.has_study_gap}
                      fieldRef={setFieldRef("has_study_gap") as React.Ref<HTMLDivElement>}
                    />
                  </div>
                  {hasStudyGap ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-1">
                      <TextareaField
                        label="Please provide gap explanation details"
                        value={profileForm.study_gap_details}
                        onChange={(value) => handleProfileFieldChange("study_gap_details", value)}
                        placeholder="Explain the study gap details"
                        disabled={submissionSaving}
                        rows={4}
                        required
                        error={fieldErrors.study_gap_details}
                        fieldRef={setFieldRef("study_gap_details") as React.Ref<HTMLTextAreaElement>}
                      />
                    </div>
                  ) : null}
                </FormSection>

                <FormSection title="English Proficiency">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChoiceField
                      label="Do you have IELTS/PTE/TOEFL/Duolingo/MOI Score?"
                      value={profileForm.has_english_test_scores}
                      onChange={(value) => handleProfileFieldChange("has_english_test_scores", value)}
                      options={YES_NO_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.has_english_test_scores}
                      fieldRef={setFieldRef("has_english_test_scores") as React.Ref<HTMLDivElement>}
                    />
                    {hasEnglishScores ? (
                      <InputField
                        label="If you have your test results, what's your score?"
                        value={profileForm.english_test_score_details}
                        onChange={(value) => handleProfileFieldChange("english_test_score_details", value)}
                        placeholder="Example: IELTS 6.5 overall"
                        disabled={submissionSaving}
                        required
                        error={fieldErrors.english_test_score_details}
                        fieldRef={setFieldRef("english_test_score_details") as React.Ref<HTMLInputElement>}
                      />
                    ) : null}
                    {hasNoEnglishScores ? (
                      <InputField
                        label="If not, when do you plan to write your exam?"
                        value={profileForm.english_test_plan}
                        onChange={(value) => handleProfileFieldChange("english_test_plan", value)}
                        placeholder="Example: August 2026"
                        disabled={submissionSaving}
                        required
                        error={fieldErrors.english_test_plan}
                        fieldRef={setFieldRef("english_test_plan") as React.Ref<HTMLInputElement>}
                      />
                    ) : null}
                  </div>
                </FormSection>

                <FormSection title="Intended Study Details">
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Intended Level of Study"
                      value={profileForm.intended_level_of_study}
                      onChange={(value) => handleProfileFieldChange("intended_level_of_study", value)}
                      options={LEVEL_OF_STUDY_OPTIONS}
                      placeholder="Select intended level"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.intended_level_of_study}
                      fieldRef={setFieldRef("intended_level_of_study") as React.Ref<HTMLSelectElement>}
                    />
                    <InputField
                      label="Interested Program Of Study"
                      value={profileForm.interested_program}
                      onChange={(value) => handleProfileFieldChange("interested_program", value)}
                      placeholder="Need Program Advising Help, what program you want to study."
                      disabled={submissionSaving}
                    />
                    <InputField
                      label="Institution Preference (if any)"
                      value={profileForm.institution_preference}
                      onChange={(value) => handleProfileFieldChange("institution_preference", value)}
                      placeholder="Enter institution preference"
                      disabled={submissionSaving}
                    />
                    <InputField
                      label="City Preference (if any)"
                      value={profileForm.city_preference}
                      onChange={(value) => handleProfileFieldChange("city_preference", value)}
                      placeholder="Enter city preference"
                      disabled={submissionSaving}
                    />
                    <InputField
                      label="Maximum Budget for Tuition Fees Per Year in BDT"
                      value={profileForm.max_tuition_budget_bdt}
                      onChange={(value) => handleProfileFieldChange("max_tuition_budget_bdt", value)}
                      placeholder="Example: 12,00,000"
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.max_tuition_budget_bdt}
                      fieldRef={setFieldRef("max_tuition_budget_bdt") as React.Ref<HTMLInputElement>}
                    />
                  </div>
                </FormSection>

                <FormSection title="Accompanying Member Details">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChoiceField
                      label="Will your spouse or children accompany you?"
                      value={profileForm.accompanying_member_status}
                      onChange={(value) => handleProfileFieldChange("accompanying_member_status", value)}
                      options={YES_NO_NOT_APPLICABLE_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.accompanying_member_status}
                      fieldRef={setFieldRef("accompanying_member_status") as React.Ref<HTMLDivElement>}
                    />
                    {hasAccompanyingMembers ? (
                      <InputField
                        label="Who will accompany you?"
                        value={profileForm.accompanying_member_details}
                        onChange={(value) => handleProfileFieldChange("accompanying_member_details", value)}
                        placeholder="Example: Spouse and one child"
                        disabled={submissionSaving}
                        required
                        error={fieldErrors.accompanying_member_details}
                        fieldRef={setFieldRef("accompanying_member_details") as React.Ref<HTMLInputElement>}
                      />
                    ) : null}
                  </div>
                </FormSection>

                <FormSection title="Funding Details">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChoiceField
                      label="Do you have at least 50 lacs to show in Bank Statement for the Past 6 months?"
                      value={profileForm.has_at_least_fifty_lacs_bank_statement}
                      onChange={(value) => handleProfileFieldChange("has_at_least_fifty_lacs_bank_statement", value)}
                      options={YES_NO_CONFUSED_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.has_at_least_fifty_lacs_bank_statement}
                      fieldRef={setFieldRef("has_at_least_fifty_lacs_bank_statement") as React.Ref<HTMLDivElement>}
                    />
                    {needsBankLoanSupport ? (
                      <ChoiceField
                        label="If no or confused, are you willing to take Bank Loan Support From Connected?"
                        value={profileForm.wants_connected_bank_loan_support}
                        onChange={(value) => handleProfileFieldChange("wants_connected_bank_loan_support", value)}
                        options={YES_NO_OPTIONS}
                        disabled={submissionSaving}
                        required
                        error={fieldErrors.wants_connected_bank_loan_support}
                        fieldRef={setFieldRef("wants_connected_bank_loan_support") as React.Ref<HTMLDivElement>}
                      />
                    ) : null}
                  </div>
                </FormSection>

                <FormSection title="Profile Review">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChoiceField
                      label="Do you have a complex academic profile where your grades are below 70% grading scale?"
                      value={profileForm.grades_below_seventy_percent}
                      onChange={(value) => handleProfileFieldChange("grades_below_seventy_percent", value)}
                      options={YES_NO_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.grades_below_seventy_percent}
                      fieldRef={setFieldRef("grades_below_seventy_percent") as React.Ref<HTMLDivElement>}
                    />
                    <ChoiceField
                      label="Is your IELTS/equivalent score below the usual requirement for your intended study level?"
                      value={profileForm.english_score_below_requirement}
                      onChange={(value) => handleProfileFieldChange("english_score_below_requirement", value)}
                      options={YES_NO_NOT_APPLICABLE_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.english_score_below_requirement}
                      fieldRef={setFieldRef("english_score_below_requirement") as React.Ref<HTMLDivElement>}
                    />
                    <ChoiceField
                      label="Is your education gap more than the usual limit for your intended study level?"
                      value={profileForm.education_gap_exceeds_limit}
                      onChange={(value) => handleProfileFieldChange("education_gap_exceeds_limit", value)}
                      options={YES_NO_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.education_gap_exceeds_limit}
                      fieldRef={setFieldRef("education_gap_exceeds_limit") as React.Ref<HTMLDivElement>}
                    />
                    <ChoiceField
                      label="Did our counsellor mention that you have a complex academic profile and might be presented limited institution and program options?"
                      value={profileForm.counsellor_discussed_complex_profile}
                      onChange={(value) => handleProfileFieldChange("counsellor_discussed_complex_profile", value)}
                      options={YES_NO_NOT_APPLICABLE_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.counsellor_discussed_complex_profile}
                      fieldRef={setFieldRef("counsellor_discussed_complex_profile") as React.Ref<HTMLDivElement>}
                    />
                    <ChoiceField
                      label="Is your admission application deadline within 2 weeks from today?"
                      value={profileForm.application_deadline_within_two_weeks}
                      onChange={(value) => handleProfileFieldChange("application_deadline_within_two_weeks", value)}
                      options={YES_NO_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.application_deadline_within_two_weeks}
                      fieldRef={setFieldRef("application_deadline_within_two_weeks") as React.Ref<HTMLDivElement>}
                    />
                    {needsCounsellorApprovalEvidence ? (
                      <FileUploadField
                        label="Provide Counsellor Approval Evidence"
                        file={counsellorApprovalEvidence}
                        onChange={handleCounsellorApprovalEvidenceChange}
                        disabled={submissionSaving}
                        required={true}
                        error={fieldErrors.counsellor_approval_evidence}
                        accept="image/*,.pdf,.doc,.docx"
                        hint={`Attach Screenshot of Suggested Options From Counsellor. Maximum file size: ${MAX_UPLOAD_SIZE_LABEL}.`}
                        inputId="counsellor-approval-evidence"
                        previewTitle="Counsellor Approval Evidence"
                        previewAlt="Counsellor Approval Evidence Preview"
                        fieldRef={setFieldRef("counsellor_approval_evidence") as React.Ref<HTMLDivElement>}
                      />
                    ) : null}
                    <ChoiceField
                      label="Are there any academic documents which you will not be able to provide?"
                      value={profileForm.has_missing_academic_documents}
                      onChange={(value) => handleProfileFieldChange("has_missing_academic_documents", value)}
                      options={YES_NO_OPTIONS}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.has_missing_academic_documents}
                      fieldRef={setFieldRef("has_missing_academic_documents") as React.Ref<HTMLDivElement>}
                    />
                    <ChoiceField
                      label="If you have a complex profile, did our counsellor mention you don't qualify for a refund and make you review our No Refund Consent Form?"
                      value={profileForm.reviewed_no_refund_consent}
                      onChange={(value) => handleProfileFieldChange("reviewed_no_refund_consent", value)}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "not_applicable", label: "Not Applicable" },
                      ]}
                      disabled={submissionSaving}
                      required
                      error={fieldErrors.reviewed_no_refund_consent}
                      fieldRef={setFieldRef("reviewed_no_refund_consent") as React.Ref<HTMLDivElement>}
                    />
                    {hasMissingDocuments ? (
                      <TextareaField
                        label="If yes, please share details of which documents you will not be able to provide"
                        value={profileForm.missing_academic_documents_details}
                        onChange={(value) => handleProfileFieldChange("missing_academic_documents_details", value)}
                        placeholder="Share the missing document details"
                        disabled={submissionSaving}
                        rows={4}
                        required
                        error={fieldErrors.missing_academic_documents_details}
                        fieldRef={setFieldRef("missing_academic_documents_details") as React.Ref<HTMLTextAreaElement>}
                      />
                    ) : null}
                  </div>

                  <div
                    className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    ref={setFieldRef("agree")}
                  >
                    <div className="text-sm font-medium text-slate-700">
                      Did you carefully read our terms and conditions contract carefully?{" "}
                      <span className="text-rose-500">*</span>
                    </div>
                    <div className="mt-3">
                      <TickboxField
                        label="Yes"
                        checked={agree}
                        onChange={(checked) => {
                          setAgree(checked);
                          if (checked && fieldErrors.agree) {
                            setFieldErrors((prev) => { const n = { ...prev }; delete n.agree; return n; });
                          }
                        }}
                        disabled={submissionSaving}
                        error={fieldErrors.agree}
                      />
                    </div>
                  </div>
                </FormSection>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm leading-6 text-rose-900">
                  <span className="font-semibold text-rose-700">Mandatory Review:</span> Please
                  carefully verify all information before submission. This profile will be used to
                  evaluate your academic background, financial capacity, eligibility, and study
                  preferences in order to provide tailored counselling and application guidance.
                  It is essential that all information is accurate and complete. Once submitted,
                  these details will be permanently locked and cannot be changed or edited by you
                  or by Connected Education, ensuring full transparency and preserving the
                  integrity of the information submitted.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            This invoice is not linked to a customer record yet, so the student information form
            cannot be saved.
          </div>
        )
      ) : null}

      {!showStudentInformation ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-4 text-sm leading-6 text-blue-900">
          Student Information is disabled for this invoice. Only the required fields in the Sign &
          Upload Photo section need to be completed before submission.
        </div>
      ) : null}

      {/* Signature section */}
      {hasStudentSignature ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Signature</h2>
          <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <div className="font-semibold text-slate-900">Signed By</div>
              <div>{invoice.student_signature_name || "-"}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Signed At</div>
              <div>{formatDate(invoice.student_signed_at)}</div>
            </div>
          </div>
          {data.student_photo_url || data.student_nid_url ? (
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {data.student_photo_url ? (
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-900">Photo</div>
                  <img
                    src={data.student_photo_url}
                    alt="Signature Photo"
                    className="w-full max-w-xs rounded-xl border border-slate-200"
                  />
                </div>
              ) : null}
              {data.student_nid_url ? (
                <UploadedFilePreview
                  title="National ID File"
                  href={data.student_nid_url}
                  fileName={invoice.student_nid}
                  alt="Student National ID"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Sign & Upload Photo</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Full Name"
              value={signatureName}
              onChange={(val) => {
                setSignatureName(val);
                if (fieldErrors.signature_name) {
                  setFieldErrors((prev) => { const n = { ...prev }; delete n.signature_name; return n; });
                }
              }}
              placeholder="Type your full name"
              disabled={submissionSaving}
              required
              error={fieldErrors.signature_name}
              fieldRef={setFieldRef("signature_name") as React.Ref<HTMLInputElement>}
            />
            <FileUploadField
              label="NID (National ID) File : (JPG, PNG, PDF, DOC, DOCX)"
              file={nidFile}
              onChange={(file) =>
                applyValidatedFileSelection("nid_file", "National ID file", file, setNidFile)
              }
              disabled={submissionSaving}
              required
              error={fieldErrors.nid_file}
              accept="image/*,.pdf,.doc,.docx"
              hint={`Maximum file size: ${MAX_UPLOAD_SIZE_LABEL}.`}
              inputId="nid-file"
              previewTitle="National ID File"
              previewAlt="National ID Preview"
              fieldRef={setFieldRef("nid_file") as React.Ref<HTMLDivElement>}
            />
            <div ref={setFieldRef("photo")}>
              <div className="mb-2 text-sm font-medium text-slate-700">
                Selfie Photo <span className="text-rose-500">*</span>
              </div>
              <p className="mb-2 text-xs text-slate-500">
                Maximum file size: {MAX_UPLOAD_SIZE_LABEL}.
              </p>
              <label
                htmlFor="student-selfie-photo"
                className={`flex min-h-[52px] w-full cursor-pointer items-center rounded-2xl border px-3 py-2 text-sm transition ${
                  submissionSaving
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : fieldErrors.photo
                    ? "border-rose-400 bg-rose-50/40 text-slate-700 hover:border-rose-500"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60"
                }`}
              >
                <input
                  id="student-selfie-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    applyValidatedFileSelection(
                      "photo",
                      "Selfie photo",
                      e.target.files?.[0] || null,
                      setPhoto,
                    );
                  }}
                  disabled={submissionSaving}
                  className="sr-only"
                />
                <span className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 font-medium text-slate-700">
                  Choose File
                </span>
                <span className={`ml-3 truncate ${photo ? "text-slate-700" : "text-slate-500"}`}>
                  {photo?.name || "Take a selfie photo here"}
                </span>
              </label>
              <FieldError message={fieldErrors.photo} />
              <SelectedFilePreview
                title="Selfie Photo"
                file={photo}
                alt="Selfie Photo Preview"
              />
            </div>
          </div>
          <div className="mt-4" ref={!showStudentInformation ? setFieldRef("agree") : undefined}>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  if (e.target.checked && fieldErrors.agree) {
                    setFieldErrors((prev) => { const n = { ...prev }; delete n.agree; return n; });
                  }
                }}
                disabled={submissionSaving}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              I agree to the terms and conditions <span className="text-rose-500 ml-0.5">*</span>
            </label>
            {!showStudentInformation && <FieldError message={fieldErrors.agree} />}
          </div>
          {agree ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm leading-6 text-rose-900">
              {signatureConfirmationText}
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
  );

  // ─── Confirm modal ────────────────────────────────────────────────────────

  const confirmModal = confirmSaveOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Confirm & Submit</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{confirmSubmitDescription}</p>
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
  ) : null;

  // ─── Page shell ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {submissionFeedback ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${feedbackClassName(submissionFeedback.type)}`}>
            {submissionFeedback.text}
          </div>
        ) : null}

        {invoiceCard}
        {studentInfoCard}
        {confirmModal}
      </div>
    </div>
  );
}
