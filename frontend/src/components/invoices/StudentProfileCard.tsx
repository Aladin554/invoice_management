import { Copy } from "lucide-react";
import {
  buildCustomerProfileClipboardText,
  CustomerProfileFormValues,
  CustomerProfileSnapshot,
  formatProfileValue,
} from "../../utils/customerProfile";

interface Props {
  title: string;
  subtitle?: string;
  profile?: CustomerProfileSnapshot | CustomerProfileFormValues | null;
  hasSubmittedAgreement?: boolean;
}

export default function StudentProfileCard({
  title,
  subtitle,
  profile,
  hasSubmittedAgreement,
}: Props) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(
      buildCustomerProfileClipboardText(profile, Boolean(hasSubmittedAgreement)),
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          <Copy size={16} />
          Copy
        </button>
      </div>

      {/* Example Content (you can replace with your actual fields) */}
      <div className="mt-4 space-y-3">
        <DetailRow label="Student phone number" value={profile?.phone} />
        <DetailRow label="Student email" value={profile?.email} />
        <DetailRow
          label="Emergency contact number"
          value={profile?.emergency_contact_number}
        />
      </div>
    </div>
  );
}

// reusable row
function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="text-sm text-slate-900">{formatProfileValue(value)}</div>
    </div>
  );
}
