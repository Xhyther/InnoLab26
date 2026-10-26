import DOMPurify from "dompurify";
export function sanitizeAdviceHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "h3", "ul", "ol", "li", "strong", "em", "br"],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}
