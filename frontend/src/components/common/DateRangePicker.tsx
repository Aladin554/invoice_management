import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarPicker({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (val: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  const today = new Date();
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 p-3 w-64 select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition">
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = fmt(new Date(viewYear, viewMonth, day));
          const isSelected = dateStr === value;
          const isToday = dateStr === fmt(today);
          const disabled =
            (minDate ? dateStr < minDate : false) ||
            (maxDate ? dateStr > maxDate : false);
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              className={`
                h-8 w-full rounded-lg text-xs font-medium transition
                ${disabled ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "cursor-pointer"}
                ${isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : isToday && !disabled
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                  : !disabled
                  ? "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateInput({
  label, value, onChange, minDate, maxDate,
}: {
  label: string; value: string; onChange: (val: string) => void; minDate?: string; maxDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 h-10 px-3 pr-4 rounded-lg border text-sm transition
          ${value
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }
          hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      >
        <Calendar size={14} className={value ? "text-blue-500" : "text-gray-400"} />
        <span>{displayValue}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
            className="ml-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition"
          >
            <X size={12} />
          </span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 top-full left-0">
          <CalendarPicker
            value={value}
            onChange={(val) => { onChange(val); setOpen(false); }}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  );
}

export function DateRangeFilterBar({
  pendingFrom,
  pendingTo,
  onFromChange,
  onToChange,
  onApply,
}: {
  pendingFrom: string;
  pendingTo: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-5 py-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <DateInput label="Start date" value={pendingFrom} onChange={onFromChange} maxDate={pendingTo || undefined} />
        <span className="text-gray-400 text-sm font-medium">→</span>
        <DateInput label="End date" value={pendingTo} onChange={onToChange} minDate={pendingFrom || undefined} />
        <button
          type="button"
          onClick={onApply}
          disabled={!pendingFrom || !pendingTo}
          className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              active === tab.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
