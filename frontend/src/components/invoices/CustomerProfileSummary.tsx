import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

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
  YES_NO_CONFUSED_OPTIONS,
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
  renderOptionAnswersAsCheckboxes?: boolean;
  enableDarkMode?: boolean;
  paymentEvidenceUrl?: string | null;
  counsellorApprovalEvidenceUrl?: string | null;
}

function SectionCard({
  title,
  children,
  enableDarkMode = true,
}: {
  title: string;
  children: ReactNode;
  enableDarkMode?: boolean;
}) {
  return (
    <section
      className={`rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 ${
        enableDarkMode ? "dark:border-slate-800 dark:bg-slate-900/70" : ""
      }`.trim()}
    >
      <div
        className={`mb-4 text-sm font-semibold text-slate-900 ${
          enableDarkMode ? "dark:text-slate-100" : ""
        }`.trim()}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
  enableDarkMode = true,
}: {
  label: string;
  value: ReactNode;
  enableDarkMode?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm ${
        enableDarkMode ? "dark:border-slate-800 dark:bg-slate-950/90" : ""
      }`.trim()}
    >
      <div
        className={`text-sm font-medium text-slate-600 ${
          enableDarkMode ? "dark:text-slate-400" : ""
        }`.trim()}
      >
        {label}
      </div>

      <div
        className={`mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-900 ${
          enableDarkMode ? "dark:text-slate-100" : ""
        }`.trim()}
      >
        {value}
      </div>
    </div>
  );
}

function OptionCheckboxValue({
  value,
  options,
  enableDarkMode = true,
}: {
  value?: string | null;
  options: Array<{ value: string; label: string }>;
  enableDarkMode?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value === option.value;

        return (
          <span
            key={option.value}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              checked
                ? `border-emerald-200 bg-emerald-50 text-emerald-700 ${enableDarkMode ? "dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : ""}`.trim()
                : `border-slate-200 bg-slate-50 text-slate-500 ${enableDarkMode ? "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400" : ""}`.trim()
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                checked
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : `border-slate-300 bg-white text-transparent ${enableDarkMode ? "dark:border-slate-600 dark:bg-slate-950" : ""}`.trim()
              }`}
            >
              <Check size={11} strokeWidth={3} />
            </span>
            <span>{option.label}</span>
          </span>
        );
      })}
    </div>
  );
}

function ResourceLink({
  label,
  href,
  enableDarkMode = true,
}: {
  label: string;
  href?: string | null;
  enableDarkMode?: boolean;
}) {
  if (!href) return null;

  let normalizedHref: string;
  try {
    const url = new URL(href, window.location.origin);
    normalizedHref = `${url.pathname}${url.search}${url.hash}`;
  } catch {
    normalizedHref = href.startsWith("/") ? href : `/${href.replace(/^\/+/, "")}`;
  }

  return (
    <a
      href={normalizedHref}
      target="_blank"
      rel="noreferrer"
      download
      className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 ${
        enableDarkMode
          ? "dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
          : ""
      }`.trim()}
    >
      <span>{label}</span>
      <ExternalLink size={16} />
    </a>
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
  renderOptionAnswersAsCheckboxes = false,
  enableDarkMode = true,
  paymentEvidenceUrl,
  counsellorApprovalEvidenceUrl,
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
      className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ${enableDarkMode ? "dark:border-slate-800 dark:bg-slate-950/90" : ""} ${className}`.trim()}
    >
      <div
        className={`flex items-start justify-between gap-4 border-b border-slate-200 pb-4 ${
          enableDarkMode ? "dark:border-slate-800" : ""
        }`.trim()}
      >
        <div className="min-w-0 flex-1">
          <h2
            className={`text-lg font-semibold text-slate-900 ${
              enableDarkMode ? "dark:text-slate-100" : ""
            }`.trim()}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={`mt-1 text-sm leading-6 text-slate-500 ${
                enableDarkMode ? "dark:text-slate-400" : ""
              }`.trim()}
            >
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
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
              enableDarkMode
                ? "dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                : ""
            }`.trim()}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        ) : null}
      </div>

      {hasData ? (
        <div className="space-y-6 pt-5">
          <div
            className={`rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm leading-6 text-slate-600 ${
              enableDarkMode ? "dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-300" : ""
            }`.trim()}
          >
            This section ensures that all details regarding the student profile are accurately
            represented and mutually understood.
          </div>

          <SectionCard title="Student Contact Details" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Student Phone Number"
                value={formatProfileValue(profile?.phone)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Student Email"
                value={formatProfileValue(profile?.email)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Emergency Contact Number"
                value={formatProfileValue(profile?.emergency_contact_number)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Relationship with Emergency Contact"
                value={formatProfileValue(profile?.emergency_contact_relationship)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Date of Birth"
                value={formatProfileDate(profile?.date_of_birth)}
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Study Preferences" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Preferred Country to Study: First Priority"
                value={optionValue(profile?.preferred_study_country_primary, STUDY_COUNTRY_OPTIONS)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Preferred Country to Study: Second Priority"
                value={optionValue(profile?.preferred_study_country_secondary, STUDY_COUNTRY_OPTIONS)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Preferred Intake"
                value={optionValue(profile?.preferred_intake, PREFERRED_INTAKE_OPTIONS)}
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Academic Background" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="SSC or O Level"
                value={formatProfileValue(profile?.academic_profile_ssc)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="HSC or A Level"
                value={formatProfileValue(profile?.academic_profile_hsc)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Bachelor"
                value={formatProfileValue(profile?.academic_profile_bachelor)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Masters"
                value={formatProfileValue(profile?.academic_profile_masters)}
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Gap Explanation" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Do you have any study gaps?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.has_study_gap}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.has_study_gap, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Did our counsellor approve your study gap?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.study_gap_counsellor_approved}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.study_gap_counsellor_approved, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Please provide gap explanation details"
                value={formatProfileValue(profile?.study_gap_details)}
                enableDarkMode={enableDarkMode}
              />
              {paymentEvidenceUrl ? (
                <ResourceLink
                  label="Payment Evidence"
                  href={paymentEvidenceUrl}
                  enableDarkMode={enableDarkMode}
                />
              ) : null}
              {counsellorApprovalEvidenceUrl ? (
                <ResourceLink
                  label="Counsellor Approval Evidence"
                  href={counsellorApprovalEvidenceUrl}
                  enableDarkMode={enableDarkMode}
                />
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="English Proficiency" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Do you have IELTS/PTE/TOEFL/Duolingo/MOI Score?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.has_english_test_scores}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.has_english_test_scores, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="If not, when do you plan to write your exam?"
                value={formatProfileValue(profile?.english_test_plan)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="If you have your test results, what's your score?"
                value={formatProfileValue(profile?.english_test_score_details)}
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Intended Study Details" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Intended Level of Study"
                value={optionValue(profile?.intended_level_of_study, LEVEL_OF_STUDY_OPTIONS)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Interested Program Of Study"
                value={formatProfileValue(profile?.interested_program)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Institution Preference"
                value={formatProfileValue(profile?.institution_preference)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="City Preference"
                value={formatProfileValue(profile?.city_preference)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Maximum Budget for Tuition Fees Per Year in BDT"
                value={formatProfileValue(profile?.max_tuition_budget_bdt)}
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Accompanying Member Details" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Will your spouse or children accompany you?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.accompanying_member_status}
                      options={YES_NO_NOT_APPLICABLE_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.accompanying_member_status, YES_NO_NOT_APPLICABLE_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Who will accompany you?"
                value={formatProfileValue(profile?.accompanying_member_details)}
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Funding Details" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Do you have at least 50 lacs to show in Bank Statement for the past 6 months?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.has_at_least_fifty_lacs_bank_statement}
                      options={YES_NO_CONFUSED_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.has_at_least_fifty_lacs_bank_statement, YES_NO_CONFUSED_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="If no or confused, are you willing to take Bank Loan Support From Connected?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.wants_connected_bank_loan_support}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.wants_connected_bank_loan_support, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>

          <SectionCard title="Profile Review" enableDarkMode={enableDarkMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Are your grades below 70% grading scale?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.grades_below_seventy_percent}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.grades_below_seventy_percent, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Is your IELTS or equivalent score below the usual requirement?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.english_score_below_requirement}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.english_score_below_requirement, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Is your education gap beyond the usual limit?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.education_gap_exceeds_limit}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.education_gap_exceeds_limit, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Did our counsellor mention that your profile may have limited institution and program options?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.counsellor_discussed_complex_profile}
                      options={YES_NO_NOT_APPLICABLE_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.counsellor_discussed_complex_profile, YES_NO_NOT_APPLICABLE_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Is your admission application deadline within 2 weeks from today?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.application_deadline_within_two_weeks}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.application_deadline_within_two_weeks, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Are there any academic documents which you will not be able to provide?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.has_missing_academic_documents}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.has_missing_academic_documents, YES_NO_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="If yes, please share details of which documents you will not be able to provide"
                value={formatProfileValue(profile?.missing_academic_documents_details)}
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="If you have a complex profile, did our counsellor review the No Refund Consent Form with you?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={profile?.reviewed_no_refund_consent}
                      options={NO_REFUND_CONSENT_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    optionValue(profile?.reviewed_no_refund_consent, NO_REFUND_CONSENT_OPTIONS)
                  )
                }
                enableDarkMode={enableDarkMode}
              />
              <DetailRow
                label="Did you carefully read our terms and conditions contract carefully?"
                value={
                  renderOptionAnswersAsCheckboxes ? (
                    <OptionCheckboxValue
                      value={hasSubmittedAgreement ? "yes" : undefined}
                      options={YES_NO_OPTIONS}
                      enableDarkMode={enableDarkMode}
                    />
                  ) : (
                    hasSubmittedAgreement ? "Yes" : "-"
                  )
                }
                enableDarkMode={enableDarkMode}
              />
            </div>
          </SectionCard>
        </div>
      ) : (
        <div
          className={`pt-5 text-sm text-slate-500 ${
            enableDarkMode ? "dark:text-slate-400" : ""
          }`.trim()}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
