export interface CustomerProfileSnapshot {
  academic_profile_ssc?: string | null;
  academic_profile_hsc?: string | null;
  academic_profile_bachelor?: string | null;
  academic_profile_masters?: string | null;
  study_gap?: string | null;
  total_funds_for_applicant?: string | null;
  total_funds_for_accompanying_members?: string | null;
  moving_abroad_member_count?: number | string | null;
  available_documents?: string[] | null;
  english_language_proficiencies?: string[] | null;
}

export interface CustomerProfileFormValues {
  academic_profile_ssc: string;
  academic_profile_hsc: string;
  academic_profile_bachelor: string;
  academic_profile_masters: string;
  study_gap: string;
  total_funds_for_applicant: string;
  total_funds_for_accompanying_members: string;
  moving_abroad_member_count: string;
  available_documents: string[];
  english_language_proficiencies: string[];
}

interface CustomerProfileOption {
  value: string;
  label: string;
}

const contentFields = [
  "academic_profile_ssc",
  "academic_profile_hsc",
  "academic_profile_bachelor",
  "academic_profile_masters",
  "study_gap",
  "total_funds_for_applicant",
  "total_funds_for_accompanying_members",
  "moving_abroad_member_count",
] as const;

const checklistFields = [
  "available_documents",
  "english_language_proficiencies",
] as const;

const normalizeString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const normalized: string[] = [];

  value.forEach((item) => {
    if (typeof item !== "string") return;

    const trimmed = item.trim();
    if (!trimmed || normalized.includes(trimmed)) return;

    normalized.push(trimmed);
  });

  return normalized;
};

export const DOCUMENT_OPTIONS: CustomerProfileOption[] = [
  { value: "ssc_or_o_level_transcript", label: "SSC or O Level transcript" },
  { value: "ssc_or_o_level_certificate", label: "SSC or O Level certificate" },
  { value: "hsc_or_a_level_transcript", label: "HSC or A Level transcript" },
  { value: "hsc_or_a_level_certificate", label: "HSC or A Level certificate" },
  { value: "bachelor_transcript", label: "Bachelor transcript" },
  { value: "bachelor_certificate", label: "Bachelor certificate" },
  { value: "masters_transcript", label: "Masters transcript" },
  { value: "masters_certificate", label: "Masters certificate" },
  { value: "passport", label: "Passport" },
  { value: "recommendation_letter", label: "Recommendation letter" },
  { value: "extracurricular_activities", label: "Extracurricular activities" },
  { value: "portfolio", label: "Portfolio" },
  { value: "cv", label: "CV" },
  { value: "work_experience_certificates", label: "Work Experience Certificates" },
];

export const ENGLISH_LANGUAGE_PROFICIENCY_OPTIONS: CustomerProfileOption[] = [
  { value: "ielts", label: "IELTS" },
  { value: "sat", label: "SAT" },
  { value: "pte", label: "PTE" },
  { value: "toefl", label: "TOEFL" },
  { value: "duolingo", label: "Duolingo" },
  { value: "moi", label: "MOI" },
  { value: "gre", label: "GRE" },
  { value: "gmat", label: "GMAT" },
];

export const createCustomerProfileForm = (
  profile?: CustomerProfileSnapshot | null,
): CustomerProfileFormValues => ({
  academic_profile_ssc: normalizeString(profile?.academic_profile_ssc),
  academic_profile_hsc: normalizeString(profile?.academic_profile_hsc),
  academic_profile_bachelor: normalizeString(profile?.academic_profile_bachelor),
  academic_profile_masters: normalizeString(profile?.academic_profile_masters),
  study_gap: normalizeString(profile?.study_gap),
  total_funds_for_applicant: normalizeString(profile?.total_funds_for_applicant),
  total_funds_for_accompanying_members: normalizeString(
    profile?.total_funds_for_accompanying_members,
  ),
  moving_abroad_member_count:
    profile?.moving_abroad_member_count === null ||
    profile?.moving_abroad_member_count === undefined
      ? ""
      : String(profile.moving_abroad_member_count),
  available_documents: normalizeStringArray(profile?.available_documents),
  english_language_proficiencies: normalizeStringArray(
    profile?.english_language_proficiencies,
  ),
});

export const hasCustomerProfileContent = (
  profile?: CustomerProfileSnapshot | CustomerProfileFormValues | null,
): boolean => {
  if (!profile) return false;

  const hasTextValue = contentFields.some((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

  if (hasTextValue) return true;

  return checklistFields.some((field) => {
    const values = profile[field];
    return Array.isArray(values) && values.length > 0;
  });
};

export const formatProfileValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";

  const text = String(value).trim();
  return text ? text : "-";
};

export const getFirstValidationError = (errors: unknown): string | null => {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0];
    }
  }

  return null;
};
