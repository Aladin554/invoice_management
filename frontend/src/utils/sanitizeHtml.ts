import DOMPurify from "dompurify";

const HTML_SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
};

const normalizeWhitespace = (value: string) =>
  value.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

/**
 * Sanitize HTML coming from the server before rendering.
 * This helps prevent XSS when using `dangerouslySetInnerHTML` or HTML parsers.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, HTML_SANITIZE_OPTIONS);
}

export function getPlainTextFromHtml(dirty?: string | null): string {
  const normalized = typeof dirty === "string" ? dirty : "";
  if (!normalized.trim()) return "";

  const sanitized = sanitizeHtml(normalized);

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(sanitized, "text/html");
    return normalizeWhitespace(doc.body.textContent || "");
  }

  return normalizeWhitespace(sanitized.replace(/<[^>]+>/g, " "));
}

export function hasMeaningfulHtmlContent(dirty?: string | null): boolean {
  return getPlainTextFromHtml(dirty).length > 0;
}

export function normalizeRichTextValue(dirty?: string | null): string {
  const normalized = typeof dirty === "string" ? dirty.trim() : "";
  if (!normalized) return "";

  const sanitized = sanitizeHtml(normalized);
  return hasMeaningfulHtmlContent(sanitized) ? sanitized : "";
}

export function getRichTextExcerpt(dirty?: string | null, maxLength = 140): string {
  const plainText = getPlainTextFromHtml(dirty);
  if (plainText.length <= maxLength) return plainText;

  return `${plainText.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
