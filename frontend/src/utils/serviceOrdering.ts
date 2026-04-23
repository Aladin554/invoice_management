export const SERVICE_GROUP_ORDER = [
  "Study Abroad Service",
  "IELTS Service",
  "Loan Service",
  "Notary Service",
];

export const SERVICE_TYPE_ORDER_BY_GROUP: Record<string, string[]> = {
  "study abroad service": [
    "Bundle UK Package (Premium)",
    "Bundle Australia Package (Premium)",
    "Bundle New Zealand Package (Premium)",
    "Bundle Ireland Package (Premium)",
    "Bundle Malaysia Package (Premium)",
    "Bundle Spain Package (Premium)",
    "SPECIAL OFFER UK Bundle Package (Premium)",
    "Accompanying Children For Study Abroad",
    "Accompanying Spouse For Study Abroad",
    "Standard UK Admission Package",
    "Standard UK Visa Package",
    "Standard Australia Admission Package",
    "Standard Australia Visa Package",
    "Standard New Zealand Admission Package",
    "Standard New Zealand Visa Package",
    "Standard Ireland Admission Package",
    "Standard Ireland Visa Package",
    "Standard Malaysia Admission Package",
    "Standard Malaysia Visa Package",
    "Standard Spain Admission Package",
    "Standard Spain Visa Package",
    "Standard Canada Admission Package",
    "Premium Australia Visa Package",
    "Premium New Zealand Visa Package",
    "Premium UK Visa Package",
  ],
  "ielts service": [
    "Grammar Foundation Program",
    "IELTS Foundation Program",
    "IELTS Advanced Program",
    "Grammar Foundation & IELTS Foundation Bundle",
    "Grammar Foundation & IELTS Advanced Bundle",
    "IELTS Foundation & IELTS Advanced Bundle",
    "Full IELTS Bundle",
    "Connected English Speaking Club",
  ],
};

export const GLOBAL_SERVICE_TYPE_ORDER = Array.from(
  new Set(Object.values(SERVICE_TYPE_ORDER_BY_GROUP).flat()),
);

export const normalizeSortLabel = (value?: string | null) =>
  (value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const sortByPreferredNameOrder = <T extends { name?: string | null }>(
  items: T[],
  preferredNames: string[] = [],
): T[] => {
  const preferredIndex = new Map(
    preferredNames.map((name, index) => [normalizeSortLabel(name), index]),
  );

  return [...items].sort((a, b) => {
    const aName = a.name || "";
    const bName = b.name || "";
    const aOrder = preferredIndex.get(normalizeSortLabel(aName)) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = preferredIndex.get(normalizeSortLabel(bName)) ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return aName.localeCompare(bName);
  });
};

export const sortServiceGroups = <T extends { name?: string | null }>(items: T[]) =>
  sortByPreferredNameOrder(items, SERVICE_GROUP_ORDER);

export const sortServiceTypes = <T extends { name?: string | null }>(items: T[]) =>
  sortByPreferredNameOrder(items, GLOBAL_SERVICE_TYPE_ORDER);

export const sortServiceTypesForGroup = <T extends { name?: string | null }>(
  items: T[],
  groupName?: string | null,
) => {
  const preferredNames = SERVICE_TYPE_ORDER_BY_GROUP[normalizeSortLabel(groupName)];

  if (!preferredNames) {
    return sortByPreferredNameOrder(items);
  }

  return sortByPreferredNameOrder(items, preferredNames);
};
