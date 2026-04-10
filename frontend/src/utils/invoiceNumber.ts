const RECEIPT_START_NUMBER = 29000;
const LEGACY_RECEIPT_OFFSET = RECEIPT_START_NUMBER - 1;

export const getDisplayReceiptNumber = (
  invoiceNumber?: string | null,
  displayInvoiceNumber?: string | null,
  id?: number | string | null,
) => {
  const explicitDisplayNumber = (displayInvoiceNumber || "").trim();
  if (explicitDisplayNumber) {
    return explicitDisplayNumber;
  }

  const normalizedInvoiceNumber = (invoiceNumber || "").trim();
  if (/^\d+$/.test(normalizedInvoiceNumber)) {
    return String(Number(normalizedInvoiceNumber));
  }

  const legacyMatch = normalizedInvoiceNumber.match(/(\d+)$/);
  if (legacyMatch) {
    return String(LEGACY_RECEIPT_OFFSET + Number(legacyMatch[1]));
  }

  if (id !== undefined && id !== null && `${id}`.trim() !== "") {
    return String(LEGACY_RECEIPT_OFFSET + Number(id));
  }

  return "-";
};
