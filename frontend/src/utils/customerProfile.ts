export interface CustomerProfileSnapshot {
  phone?: string | null;
  email?: string | null;
  emergency_contact_number?: string | null;
  emergency_contact_relationship?: string | null;
  date_of_birth?: string | null;
  preferred_study_country_primary?: string | null;
  preferred_study_country_secondary?: string | null;
  preferred_intake?: string | null;
  academic_profile_ssc?: string | null;
  academic_profile_hsc?: string | null;
  academic_profile_bachelor?: string | null;
  academic_profile_masters?: string | null;
  has_study_gap?: string | null;
  study_gap_details?: string | null;
  study_gap_counsellor_approved?: string | null;
  has_english_test_scores?: string | null;
  english_test_plan?: string | null;
  english_test_score_details?: string | null;
  intended_level_of_study?: string | null;
  interested_program?: string | null;
  institution_preference?: string | null;
  city_preference?: string | null;
  max_tuition_budget_bdt?: string | null;
  accompanying_member_status?: string | null;
  accompanying_member_details?: string | null;
  has_at_least_fifty_lacs_bank_statement?: string | null;
  wants_connected_bank_loan_support?: string | null;
  grades_below_seventy_percent?: string | null;
  english_score_below_requirement?: string | null;
  education_gap_exceeds_limit?: string | null;
  counsellor_discussed_complex_profile?: string | null;
  application_deadline_within_two_weeks?: string | null;
  has_missing_academic_documents?: string | null;
  missing_academic_documents_details?: string | null;
  reviewed_no_refund_consent?: string | null;
}

export interface CustomerProfileFormValues {
  phone: string;
  email: string;
  emergency_contact_number: string;
  emergency_contact_relationship: string;
  date_of_birth: string;
  preferred_study_country_primary: string;
  preferred_study_country_secondary: string;
  preferred_intake: string;
  academic_profile_ssc: string;
  academic_profile_hsc: string;
  academic_profile_bachelor: string;
  academic_profile_masters: string;
  has_study_gap: string;
  study_gap_details: string;
  study_gap_counsellor_approved: string;
  has_english_test_scores: string;
  english_test_plan: string;
  english_test_score_details: string;
  intended_level_of_study: string;
  interested_program: string;
  institution_preference: string;
  city_preference: string;
  max_tuition_budget_bdt: string;
  accompanying_member_status: string;
  accompanying_member_details: string;
  has_at_least_fifty_lacs_bank_statement: string;
  wants_connected_bank_loan_support: string;
  grades_below_seventy_percent: string;
  english_score_below_requirement: string;
  education_gap_exceeds_limit: string;
  counsellor_discussed_complex_profile: string;
  application_deadline_within_two_weeks: string;
  has_missing_academic_documents: string;
  missing_academic_documents_details: string;
  reviewed_no_refund_consent: string;
}

export interface CustomerProfileOption {
  value: string;
  label: string;
}

export const CUSTOMER_PROFILE_FORM_FIELDS: Array<keyof CustomerProfileFormValues> = [
  "phone",
  "email",
  "emergency_contact_number",
  "emergency_contact_relationship",
  "date_of_birth",
  "preferred_study_country_primary",
  "preferred_study_country_secondary",
  "preferred_intake",
  "academic_profile_ssc",
  "academic_profile_hsc",
  "academic_profile_bachelor",
  "academic_profile_masters",
  "has_study_gap",
  "study_gap_details",
  "study_gap_counsellor_approved",
  "has_english_test_scores",
  "english_test_plan",
  "english_test_score_details",
  "intended_level_of_study",
  "interested_program",
  "institution_preference",
  "city_preference",
  "max_tuition_budget_bdt",
  "accompanying_member_status",
  "accompanying_member_details",
  "has_at_least_fifty_lacs_bank_statement",
  "wants_connected_bank_loan_support",
  "grades_below_seventy_percent",
  "english_score_below_requirement",
  "education_gap_exceeds_limit",
  "counsellor_discussed_complex_profile",
  "application_deadline_within_two_weeks",
  "has_missing_academic_documents",
  "missing_academic_documents_details",
  "reviewed_no_refund_consent",
];

const CUSTOMER_PROFILE_VISIBLE_FIELDS: Array<keyof CustomerProfileFormValues> = [
  "phone",
  "email",
  "emergency_contact_number",
  "emergency_contact_relationship",
  "date_of_birth",
  "preferred_study_country_primary",
  "preferred_study_country_secondary",
  "preferred_intake",
  "academic_profile_ssc",
  "academic_profile_hsc",
  "academic_profile_bachelor",
  "academic_profile_masters",
  "has_study_gap",
  "study_gap_details",
  "has_english_test_scores",
  "english_test_plan",
  "english_test_score_details",
  "intended_level_of_study",
  "interested_program",
  "institution_preference",
  "city_preference",
  "max_tuition_budget_bdt",
  "accompanying_member_status",
  "accompanying_member_details",
  "has_at_least_fifty_lacs_bank_statement",
  "wants_connected_bank_loan_support",
];

const contentFields = CUSTOMER_PROFILE_VISIBLE_FIELDS;

const normalizeString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

export const YES_NO_OPTIONS: CustomerProfileOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const YES_NO_NOT_APPLICABLE_OPTIONS: CustomerProfileOption[] = [
  ...YES_NO_OPTIONS,
  { value: "not_applicable", label: "Not Applicable" },
];

export const YES_NO_CONFUSED_OPTIONS: CustomerProfileOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "confused", label: "Confused" },
];

export const STUDY_COUNTRY_OPTIONS: CustomerProfileOption[] = [
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "united_kingdom", label: "United Kingdom" },
  { value: "united_states", label: "United States" },
  { value: "ireland", label: "Ireland" },
  { value: "new_zealand", label: "New Zealand" },
  { value: "germany", label: "Germany" },
  { value: "sweden", label: "Sweden" },
  { value: "finland", label: "Finland" },
  { value: "denmark", label: "Denmark" },
  { value: "france", label: "France" },
  { value: "malta", label: "Malta" },
  { value: "malaysia", label: "Malaysia" },
  { value: "united_arab_emirates", label: "United Arab Emirates" },
];

export const PREFERRED_INTAKE_OPTIONS: CustomerProfileOption[] = [
  { value: "january", label: "January" },
  { value: "may", label: "May" },
  { value: "september", label: "September" },
  { value: "flexible", label: "Flexible" },
];

export const LEVEL_OF_STUDY_OPTIONS: CustomerProfileOption[] = [
  { value: "foundation", label: "Foundation" },
  { value: "bachelor", label: "Bachelor" },
  { value: "masters", label: "Masters" },
];

export const NO_REFUND_CONSENT_OPTIONS: CustomerProfileOption[] = [
  { value: "yes", label: "Yes" },
  { value: "not_applicable", label: "Not Applicable" },
];

export const createCustomerProfileForm = (
  profile?: CustomerProfileSnapshot | null,
): CustomerProfileFormValues => ({
  phone: normalizeString(profile?.phone),
  email: normalizeString(profile?.email),
  emergency_contact_number: normalizeString(profile?.emergency_contact_number),
  emergency_contact_relationship: normalizeString(
    profile?.emergency_contact_relationship,
  ),
  date_of_birth: normalizeString(profile?.date_of_birth),
  preferred_study_country_primary: normalizeString(
    profile?.preferred_study_country_primary,
  ),
  preferred_study_country_secondary: normalizeString(
    profile?.preferred_study_country_secondary,
  ),
  preferred_intake: normalizeString(profile?.preferred_intake),
  academic_profile_ssc: normalizeString(profile?.academic_profile_ssc),
  academic_profile_hsc: normalizeString(profile?.academic_profile_hsc),
  academic_profile_bachelor: normalizeString(profile?.academic_profile_bachelor),
  academic_profile_masters: normalizeString(profile?.academic_profile_masters),
  has_study_gap: normalizeString(profile?.has_study_gap),
  study_gap_details: normalizeString(profile?.study_gap_details),
  study_gap_counsellor_approved: normalizeString(profile?.study_gap_counsellor_approved),
  has_english_test_scores: normalizeString(profile?.has_english_test_scores),
  english_test_plan: normalizeString(profile?.english_test_plan),
  english_test_score_details: normalizeString(profile?.english_test_score_details),
  intended_level_of_study: normalizeString(profile?.intended_level_of_study),
  interested_program: normalizeString(profile?.interested_program),
  institution_preference: normalizeString(profile?.institution_preference),
  city_preference: normalizeString(profile?.city_preference),
  max_tuition_budget_bdt: normalizeString(profile?.max_tuition_budget_bdt),
  accompanying_member_status: normalizeString(profile?.accompanying_member_status),
  accompanying_member_details: normalizeString(profile?.accompanying_member_details),
  has_at_least_fifty_lacs_bank_statement: normalizeString(
    profile?.has_at_least_fifty_lacs_bank_statement,
  ),
  wants_connected_bank_loan_support: normalizeString(
    profile?.wants_connected_bank_loan_support,
  ),
  grades_below_seventy_percent: normalizeString(profile?.grades_below_seventy_percent),
  english_score_below_requirement: normalizeString(
    profile?.english_score_below_requirement,
  ),
  education_gap_exceeds_limit: normalizeString(profile?.education_gap_exceeds_limit),
  counsellor_discussed_complex_profile: normalizeString(
    profile?.counsellor_discussed_complex_profile,
  ),
  application_deadline_within_two_weeks: normalizeString(
    profile?.application_deadline_within_two_weeks,
  ),
  has_missing_academic_documents: normalizeString(
    profile?.has_missing_academic_documents,
  ),
  missing_academic_documents_details: normalizeString(
    profile?.missing_academic_documents_details,
  ),
  reviewed_no_refund_consent: normalizeString(profile?.reviewed_no_refund_consent),
});

export const hasCustomerProfileContent = (
  profile?: CustomerProfileSnapshot | CustomerProfileFormValues | null,
): boolean => {
  if (!profile) return false;

  return contentFields.some((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
};

export const formatProfileValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";

  const text = String(value).trim();
  return text ? text : "-";
};

export const formatProfileDate = (value: unknown): string => {
  const text = formatProfileValue(value);
  if (text === "-") return text;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getOptionLabel = (
  value: string | null | undefined,
  options: CustomerProfileOption[],
): string => {
  const normalized = formatProfileValue(value);
  if (normalized === "-") return normalized;

  const selected = options.find((option) => option.value === value);
  return selected?.label ?? normalized;
};

export const buildCustomerProfileClipboardText = (
  profile?: CustomerProfileSnapshot | CustomerProfileFormValues | null,
  _hasSubmittedAgreement = false,
): string =>
  [
    `Student Phone Number: ${formatProfileValue(profile?.phone)}`,
    `Student Email: ${formatProfileValue(profile?.email)}`,
    `Emergency Contact Number: ${formatProfileValue(profile?.emergency_contact_number)}`,
    `Relationship with Emergency Contact Number: ${formatProfileValue(profile?.emergency_contact_relationship)}`,
    `Date of Birth: ${formatProfileDate(profile?.date_of_birth)}`,
    "",
    `First Priority Country: ${getOptionLabel(
      profile?.preferred_study_country_primary,
      STUDY_COUNTRY_OPTIONS,
    )}`,
    `Second Priority Country: ${getOptionLabel(
      profile?.preferred_study_country_secondary,
      STUDY_COUNTRY_OPTIONS,
    )}`,
    `Preferred Intake: ${getOptionLabel(
      profile?.preferred_intake,
      PREFERRED_INTAKE_OPTIONS,
    )}`,
    "",
    `SSC/O Level: ${formatProfileValue(profile?.academic_profile_ssc)}`,
    `HSC/A Level: ${formatProfileValue(profile?.academic_profile_hsc)}`,
    `Bachelor: ${formatProfileValue(profile?.academic_profile_bachelor)}`,
    `Masters: ${formatProfileValue(profile?.academic_profile_masters)}`,
    "",
    `Study Gap : ${getOptionLabel(profile?.has_study_gap, YES_NO_OPTIONS)}`,
    `Gap Explanation: ${formatProfileValue(profile?.study_gap_details)}`,
    "",
    `English Test Available : ${getOptionLabel(
      profile?.has_english_test_scores,
      YES_NO_OPTIONS,
    )}`,
    `Planned Test Date: ${formatProfileValue(profile?.english_test_plan)}`,
    `Test Score: ${formatProfileValue(profile?.english_test_score_details)}`,
    "",
    `Intended Study Level: ${getOptionLabel(
      profile?.intended_level_of_study,
      LEVEL_OF_STUDY_OPTIONS,
    )}`,
    `Program: ${formatProfileValue(profile?.interested_program)}`,
    `Institution: ${formatProfileValue(profile?.institution_preference)}`,
    `City: ${formatProfileValue(profile?.city_preference)}`,
    `Yearly Budget (BDT): ${formatProfileValue(
      profile?.max_tuition_budget_bdt,
    )}`,
    "",
    `Accompanying : ${getOptionLabel(
      profile?.accompanying_member_status,
      YES_NO_NOT_APPLICABLE_OPTIONS,
    )}`,
    `Who will accompany you?: ${formatProfileValue(profile?.accompanying_member_details)}`,
    "",
    `Bank Statement 50 Lacs : ${getOptionLabel(
      profile?.has_at_least_fifty_lacs_bank_statement,
      YES_NO_CONFUSED_OPTIONS,
    )}`,
    `Loan Support Needed (If no/confused) : ${getOptionLabel(
      profile?.wants_connected_bank_loan_support,
      YES_NO_OPTIONS,
    )}`,
  ].join("\n");

export const getFirstValidationError = (errors: unknown): string | null => {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0];
    }
  }

  return null;
};
