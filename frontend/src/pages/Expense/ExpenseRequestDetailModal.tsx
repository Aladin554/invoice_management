import { ReactNode } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  FileText,
  Wallet,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { PaymentRequestItem } from "./types";

interface Props {
  request: PaymentRequestItem;
  onClose: () => void;
}

const formatMoney = (value: string) => `${Number(value || 0).toFixed(2)} BDT`;

const initials = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-gray-900/60">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);

function FileGallery({ label, urls, colorClass }: { label: string; urls: string[]; colorClass: string }) {
  if (urls.length === 0) return null;
  const multiple = urls.length > 1;
  return (
    <div className="pt-1">
      <div className={`mb-2 text-xs font-semibold ${colorClass}`}>{label}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, index) =>
          isImageUrl(url) ? (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-gray-900"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <img
                  src={url}
                  alt={`${label} ${index + 1}`}
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow">
                    <ZoomIn size={14} /> View full
                  </span>
                </div>
              </div>
              {multiple && (
                <div className="px-2 py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Photo {index + 1}
                </div>
              )}
            </a>
          ) : (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-gray-600 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-gray-900 dark:text-gray-300"
            >
              <FileText size={28} />
              <span className="text-xs font-semibold">Open PDF{multiple ? ` ${index + 1}` : ""}</span>
            </a>
          )
        )}
      </div>
    </div>
  );
}

function ReviewNote({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  accent,
  children,
}: {
  icon: ReactNode;
  title: string;
  accent: "blue" | "violet" | "emerald" | "rose";
  children: ReactNode;
}) {
  const accents = {
    blue: "border-blue-200 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-500/5",
    violet: "border-violet-200 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/5",
    emerald: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5",
    rose: "border-rose-200 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/5",
  };
  const iconAccents = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${accents[accent]}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex size-6 items-center justify-center rounded-md ${iconAccents[accent]}`}>{icon}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</span>
      </div>
      <div className="space-y-2 pl-8">{children}</div>
    </div>
  );
}

export default function ExpenseRequestDetailModal({ request, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="no-scrollbar max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Expense Request Details</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Hero summary */}
          <div className="flex items-start justify-between gap-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900/60 dark:to-gray-900/30">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {initials(request.employee?.first_name, request.employee?.last_name)}
              </span>
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900 dark:text-gray-100">
                  {request.employee?.first_name} {request.employee?.last_name}
                </div>
                <div className="truncate text-sm text-gray-500 dark:text-gray-400">{request.category?.name || "-"}</div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatMoney(request.amount)}</div>
              <div className="mt-1">
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={<Calendar size={16} />} label="Expense Date" value={request.expense_date} />
            <InfoTile icon={<Wallet size={16} />} label="Payment Preference" value={request.payment_preference} />
          </div>

          {/* Purpose */}
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Purpose
            </div>
            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:bg-gray-900/60 dark:text-gray-200">
              {request.purpose}
            </p>
          </div>

          {/* Receipt */}
          {request.receipt_url && (
            <a
              href={request.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
            >
              <FileText size={16} /> View Receipt
            </a>
          )}

          {/* Review / payment timeline */}
          {(request.finance_reviewer || request.finance_note) && (
            <SectionCard icon={<CheckCircle2 size={14} />} title="Finance Review" accent="blue">
              <ReviewNote
                label="Reviewed By"
                value={
                  request.finance_reviewer
                    ? `${request.finance_reviewer.first_name} ${request.finance_reviewer.last_name}`
                    : "-"
                }
              />
              {request.finance_note && (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/10 dark:text-gray-300">
                  {request.finance_note}
                </p>
              )}
              <FileGallery
                label="Money Provided Proof"
                urls={request.money_provided_urls ?? []}
                colorClass="text-blue-700 dark:text-blue-400"
              />
            </SectionCard>
          )}

          {(request.owner_reviewer || request.owner_note) && (
            <SectionCard icon={<CheckCircle2 size={14} />} title="Owner Review" accent="violet">
              <ReviewNote
                label="Reviewed By"
                value={
                  request.owner_reviewer ? `${request.owner_reviewer.first_name} ${request.owner_reviewer.last_name}` : "-"
                }
              />
              {request.owner_note && (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/10 dark:text-gray-300">
                  {request.owner_note}
                </p>
              )}
            </SectionCard>
          )}

          {(request.settled_by || (request.used_receipt_urls?.length ?? 0) > 0) && (
            <SectionCard icon={<CheckCircle2 size={14} />} title="Used Receipt / Settlement" accent="emerald">
              <ReviewNote
                label="Settled By"
                value={request.settled_by ? `${request.settled_by.first_name} ${request.settled_by.last_name}` : "-"}
              />
              {request.amount_used && <ReviewNote label="Amount Used" value={formatMoney(request.amount_used)} />}
              {request.amount_returned && (
                <ReviewNote label="Amount Returned" value={formatMoney(request.amount_returned)} />
              )}
              {request.settlement_note && (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/10 dark:text-gray-300">
                  {request.settlement_note}
                </p>
              )}
              <FileGallery
                label="Used Receipt"
                urls={request.used_receipt_urls ?? []}
                colorClass="text-emerald-700 dark:text-emerald-400"
              />
            </SectionCard>
          )}

          {request.payment && (
            <SectionCard icon={<Banknote size={14} />} title="Payment" accent="emerald">
              <ReviewNote label="Method" value={request.payment.payment_method} />
              <ReviewNote label="Amount Paid" value={formatMoney(request.payment.amount_paid)} />
              <ReviewNote label="Payment Date" value={request.payment.payment_date} />
              {request.payment.transaction_ref && (
                <ReviewNote label="Transaction Ref" value={request.payment.transaction_ref} />
              )}
              {request.payment.receiver_name && <ReviewNote label="Receiver" value={request.payment.receiver_name} />}
              {request.payment.recorded_by && (
                <ReviewNote
                  label="Recorded By"
                  value={`${request.payment.recorded_by.first_name} ${request.payment.recorded_by.last_name}`}
                />
              )}
              {request.payment.notes && (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/10 dark:text-gray-300">
                  {request.payment.notes}
                </p>
              )}
              {request.payment.proof_url && (
                <a
                  href={request.payment.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <FileText size={14} /> View Payment Proof
                </a>
              )}
            </SectionCard>
          )}

          {(request.payment_rejecter || request.payment_note) && (
            <SectionCard icon={<XCircle size={14} />} title="Payment Rejected" accent="rose">
              <ReviewNote
                label="Rejected By"
                value={
                  request.payment_rejecter
                    ? `${request.payment_rejecter.first_name} ${request.payment_rejecter.last_name}`
                    : "-"
                }
              />
              {request.payment_note && (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/10 dark:text-gray-300">
                  {request.payment_note}
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
