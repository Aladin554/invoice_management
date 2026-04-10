import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

import {
  buildCustomerProfileClipboardText,
  CustomerProfileFormValues,
  CustomerProfileSnapshot,
  formatProfileDate,
  formatProfileValue,
  getOptionLabel,
  hasCustomerProfileContent,
  LEVEL_OF_STUDY_OPTIONS,
  NO_REFUND_CONSENT_OPTIONS,
  PREFERRED_INTAKE_OPTIONS,
  STUDY_COUNTRY_OPTIONS,
  YES_NO_NOT_APPLICABLE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils/customerProfile";

interface CustomerProfileSummaryProps {
  profile?: CustomerProfileSnapshot | CustomerProfileFormValues | null;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
  alwaysShowContent?: boolean;
  hasSubmittedAgreement?: boolean;
  showCopyAction?: boolean;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="mb-4 text-sm font-semibold text-slate-900">{title}</div>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {/* FIXED: removed uppercase + tracking */}
      <div className="text-sm font-medium text-slate-600">
        {label}
      </div>

      <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-900">
        {value}
      </div>
    </div>
  );
}

const optionValue = (
  value: string | null | undefined,
  options: Array<{ value: string; label: string }>,
) => getOptionLabel(value, options);

const writeTextToClipboard = async (text: string) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export default function CustomerProfileSummary({
  profile,
  title = "Profile Agreement for the Client",
  subtitle,
  emptyMessage = "No student profile details have been saved yet.",
  className = "",
  alwaysShowContent = false,
  hasSubmittedAgreement = false,
  showCopyAction = false,
}: CustomerProfileSummaryProps) {
  const hasData = alwaysShowContent || hasCustomerProfileContent(profile);
  const canCopy = showCopyAction && hasData;
  const [copied, setCopied] = useState(false);
  const resetCopiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetCopiedTimeoutRef.current !== null) {
        window.clearTimeout(resetCopiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!canCopy) return;

    try {
      await writeTextToClipboard(
        buildCustomerProfileClipboardText(profile, hasSubmittedAgreement),
      );
      setCopied(true);

      if (resetCopiedTimeoutRef.current !== null) {
        window.clearTimeout(resetCopiedTimeoutRef.current);
      }

      resetCopiedTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        {showCopyAction ? (
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!canCopy}
            aria-label="Copy student profile"
            title={copied ? "Copied" : "Copy student profile"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        ) : null}
      </div>

      {hasData ? (
        <div className="space-y-6 pt-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
            This section ensures that all details regarding the student profile are accurately
            represented and mutually understood.
          </div>

          <SectionCard title="Student Contact Details">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Student Phone Number" value={formatProfileValue(profile?.phone)} />
              <DetailRow label="Student Email" value={formatProfileValue(profile?.email)} />
              <DetailRow
                label="Emergency Contact Number"
                value={formatProfileValue(profile?.emergency_contact_number)}
              />
              <DetailRow
                label="Relationship with Emergency Contact"
                value={formatProfileValue(profile?.emergency_contact_relationship)}
              />
              <DetailRow label="Date of Birth" value={formatProfileDate(profile?.date_of_birth)} />
            </div>
          </SectionCard>

          <SectionCard title="Study Preferences">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Preferred Country to Study: First Priority"
                value={optionValue(profile?.preferred_study_country_primary, STUDY_COUNTRY_OPTIONS)}
              />
              <DetailRow
                label="Preferred Country to Study: Second Priority"
                value={optionValue(profile?.preferred_study_country_secondary, STUDY_COUNTRY_OPTIONS)}
              />
              <DetailRow
                label="Preferred Intake"
                value={optionValue(profile?.preferred_intake, PREFERRED_INTAKE_OPTIONS)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Academic Background">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="SSC or O Level" value={formatProfileValue(profile?.academic_profile_ssc)} />
              <DetailRow label="HSC or A Level" value={formatProfileValue(profile?.academic_profile_hsc)} />
              <DetailRow
                label="Bachelor"
                value={formatProfileValue(profile?.academic_profile_bachelor)}
              />
              <DetailRow label="Masters" value={formatProfileValue(profile?.academic_profile_masters)} />
            </div>
          </SectionCard>

          <SectionCard title="Gap Explanation">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Do you have any study gaps?"
                value={optionValue(profile?.has_study_gap, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="Did our counsellor approve your study gap?"
                value={optionValue(profile?.study_gap_counsellor_approved, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="Please provide gap explanation details"
                value={formatProfileValue(profile?.study_gap_details)}
              />
            </div>
          </SectionCard>

          <SectionCard title="English Proficiency">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Do you have IELTS/PTE/TOEFL/Duolingo/MOI Score?"
                value={optionValue(profile?.has_english_test_scores, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="If not, when do you plan to write your exam?"
                value={formatProfileValue(profile?.english_test_plan)}
              />
              <DetailRow
                label="If you have your test results, what's your score?"
                value={formatProfileValue(profile?.english_test_score_details)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Intended Study Details">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Intended Level of Study"
                value={optionValue(profile?.intended_level_of_study, LEVEL_OF_STUDY_OPTIONS)}
              />
              <DetailRow
                label="Interested Program Of Study"
                value={formatProfileValue(profile?.interested_program)}
              />
              <DetailRow
                label="Institution Preference"
                value={formatProfileValue(profile?.institution_preference)}
              />
              <DetailRow
                label="City Preference"
                value={formatProfileValue(profile?.city_preference)}
              />
              <DetailRow
                label="Maximum Budget for Tuition Fees Per Year in BDT"
                value={formatProfileValue(profile?.max_tuition_budget_bdt)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Accompanying Member Details">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Will your spouse or children accompany you?"
                value={optionValue(profile?.accompanying_member_status, YES_NO_NOT_APPLICABLE_OPTIONS)}
              />
              <DetailRow
                label="Who will accompany you?"
                value={formatProfileValue(profile?.accompanying_member_details)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Funding Details">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Do you have at least 50 lacs to show in Bank Statement for the past 6 months?"
                value={optionValue(profile?.has_at_least_fifty_lacs_bank_statement, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="If no, are you willing to take Bank Loan Support From Connected?"
                value={optionValue(profile?.wants_connected_bank_loan_support, YES_NO_OPTIONS)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Profile Review">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Are your grades below 70% grading scale?"
                value={optionValue(profile?.grades_below_seventy_percent, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="Is your IELTS or equivalent score below the usual requirement?"
                value={optionValue(profile?.english_score_below_requirement, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="Is your education gap beyond the usual limit?"
                value={optionValue(profile?.education_gap_exceeds_limit, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="Did our counsellor mention that your profile may have limited institution and program options?"
                value={optionValue(profile?.counsellor_discussed_complex_profile, YES_NO_NOT_APPLICABLE_OPTIONS)}
              />
              <DetailRow
                label="Is your admission application deadline within 2 weeks from today?"
                value={optionValue(profile?.application_deadline_within_two_weeks, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="Are there any academic documents which you will not be able to provide?"
                value={optionValue(profile?.has_missing_academic_documents, YES_NO_OPTIONS)}
              />
              <DetailRow
                label="If yes, please share details of which documents you will not be able to provide"
                value={formatProfileValue(profile?.missing_academic_documents_details)}
              />
              <DetailRow
                label="If you have a complex profile, did our counsellor review the No Refund Consent Form with you?"
                value={optionValue(profile?.reviewed_no_refund_consent, NO_REFUND_CONSENT_OPTIONS)}
              />
              <DetailRow
                label="Did you carefully read our terms and conditions contract carefully?"
                value={hasSubmittedAgreement ? "Yes" : "-"}
              />
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="pt-5 text-sm text-slate-500">{emptyMessage}</div>
      )}
    </div>
  );
}
