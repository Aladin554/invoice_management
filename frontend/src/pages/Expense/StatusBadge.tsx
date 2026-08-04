import { PaymentRequestItem, STATUS_COLORS, STATUS_LABELS } from "./types";

interface Props {
  status: PaymentRequestItem["status"];
}

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
