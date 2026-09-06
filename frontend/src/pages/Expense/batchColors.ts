// Distinct color per bulk-approval batch, so requests that share one
// receipt can be spotted at a glance — same batch always gets the same
// color (derived from its batch_id), different batches get different ones.
//
// Hues are the validated 8-slot categorical palette (see dataviz skill,
// references/palette.md): ordering and steps are chosen so every adjacent
// pair clears the colorblind-safety and normal-vision distinction floors in
// both light and dark mode — not picked by eye.
export interface BatchColor {
  badgeBg: string;
  badgeText: string;
  rowBorder: string;
  stripeBg: string;
}

const BATCH_COLORS: BatchColor[] = [
  { // blue
    badgeBg: "bg-[#2a78d6]/10 dark:bg-[#3987e5]/15",
    badgeText: "text-[#2a78d6] dark:text-[#3987e5]",
    rowBorder: "border-l-[#2a78d6] dark:border-l-[#3987e5]",
    stripeBg: "bg-[#2a78d6] dark:bg-[#3987e5]",
  },
  { // orange
    badgeBg: "bg-[#eb6834]/10 dark:bg-[#d95926]/15",
    badgeText: "text-[#eb6834] dark:text-[#d95926]",
    rowBorder: "border-l-[#eb6834] dark:border-l-[#d95926]",
    stripeBg: "bg-[#eb6834] dark:bg-[#d95926]",
  },
  { // aqua
    badgeBg: "bg-[#1baf7a]/10 dark:bg-[#199e70]/15",
    badgeText: "text-[#1baf7a] dark:text-[#199e70]",
    rowBorder: "border-l-[#1baf7a] dark:border-l-[#199e70]",
    stripeBg: "bg-[#1baf7a] dark:bg-[#199e70]",
  },
  { // yellow
    badgeBg: "bg-[#eda100]/10 dark:bg-[#c98500]/15",
    badgeText: "text-[#eda100] dark:text-[#c98500]",
    rowBorder: "border-l-[#eda100] dark:border-l-[#c98500]",
    stripeBg: "bg-[#eda100] dark:bg-[#c98500]",
  },
  { // magenta
    badgeBg: "bg-[#e87ba4]/10 dark:bg-[#d55181]/15",
    badgeText: "text-[#e87ba4] dark:text-[#d55181]",
    rowBorder: "border-l-[#e87ba4] dark:border-l-[#d55181]",
    stripeBg: "bg-[#e87ba4] dark:bg-[#d55181]",
  },
  { // green
    badgeBg: "bg-[#008300]/10 dark:bg-[#008300]/15",
    badgeText: "text-[#008300] dark:text-[#008300]",
    rowBorder: "border-l-[#008300]",
    stripeBg: "bg-[#008300]",
  },
  { // violet
    badgeBg: "bg-[#4a3aa7]/10 dark:bg-[#9085e9]/15",
    badgeText: "text-[#4a3aa7] dark:text-[#9085e9]",
    rowBorder: "border-l-[#4a3aa7] dark:border-l-[#9085e9]",
    stripeBg: "bg-[#4a3aa7] dark:bg-[#9085e9]",
  },
  { // red
    badgeBg: "bg-[#e34948]/10 dark:bg-[#e66767]/15",
    badgeText: "text-[#e34948] dark:text-[#e66767]",
    rowBorder: "border-l-[#e34948] dark:border-l-[#e66767]",
    stripeBg: "bg-[#e34948] dark:bg-[#e66767]",
  },
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getBatchColor = (batchId: string): BatchColor =>
  BATCH_COLORS[hashString(batchId) % BATCH_COLORS.length];
