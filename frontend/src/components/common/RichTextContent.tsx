import { hasMeaningfulHtmlContent, sanitizeHtml } from "../../utils/sanitizeHtml";

interface RichTextContentProps {
  html?: string | null;
  className?: string;
  compact?: boolean;
}

export default function RichTextContent({
  html,
  className = "",
  compact = false,
}: RichTextContentProps) {
  if (!hasMeaningfulHtmlContent(html)) {
    return null;
  }

  const classes = [
    "rich-text-content",
    compact ? "rich-text-content-compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html || "") }} />;
}
