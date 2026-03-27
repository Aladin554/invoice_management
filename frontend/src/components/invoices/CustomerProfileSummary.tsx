import {
  CustomerProfileFormValues,
  CustomerProfileSnapshot,
  DOCUMENT_OPTIONS,
  ENGLISH_LANGUAGE_PROFICIENCY_OPTIONS,
  formatProfileValue,
  hasCustomerProfileContent,
} from "../../utils/customerProfile";

interface CustomerProfileSummaryProps {
  profile?: CustomerProfileSnapshot | CustomerProfileFormValues | null;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
}

function DetailCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-gray-100">
        {formatProfileValue(value)}
      </div>
    </div>
  );
}

function ChecklistSection({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        {title}
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">None selected</div>
      )}
    </div>
  );
}

const resolveSelectedLabels = (
  values: string[] | null | undefined,
  options: Array<{ value: string; label: string }>,
): string[] => {
  if (!Array.isArray(values) || values.length === 0) return [];

  const labelMap = new Map(options.map((option) => [option.value, option.label]));

  return values.map((value) => labelMap.get(value) ?? value);
};

export default function CustomerProfileSummary({
  profile,
  title = "Student Profile",
  subtitle,
  emptyMessage = "No student profile details have been saved yet.",
  className = "",
}: CustomerProfileSummaryProps) {
  const hasData = hasCustomerProfileContent(profile);
  const selectedDocuments = resolveSelectedLabels(profile?.available_documents, DOCUMENT_OPTIONS);
  const selectedProficiencies = resolveSelectedLabels(
    profile?.english_language_proficiencies,
    ENGLISH_LANGUAGE_PROFICIENCY_OPTIONS,
  );

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`.trim()}
    >
      <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>

      {hasData ? (
        <div className="space-y-6 pt-5">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Academic Profile
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailCard label="SSC or O Level" value={profile?.academic_profile_ssc} />
              <DetailCard label="HSC or A Level" value={profile?.academic_profile_hsc} />
              <DetailCard label="Bachelor" value={profile?.academic_profile_bachelor} />
              <DetailCard label="Masters" value={profile?.academic_profile_masters} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard label="Study Gap" value={profile?.study_gap} />
            <DetailCard
              label="Total Funds for Applicant"
              value={profile?.total_funds_for_applicant}
            />
            <DetailCard
              label="Funds for Accompanying Members"
              value={profile?.total_funds_for_accompanying_members}
            />
            <DetailCard
              label="Members Moving Abroad"
              value={profile?.moving_abroad_member_count}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChecklistSection title="Documents Student Can Provide" values={selectedDocuments} />
            <ChecklistSection
              title="English Language Proficiency"
              values={selectedProficiencies}
            />
          </div>
        </div>
      ) : (
        <div className="pt-5 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</div>
      )}
    </div>
  );
}
