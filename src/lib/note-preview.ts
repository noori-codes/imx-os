/** Shared HTML → plain text helpers for note previews and word counts. */

export function stripNoteHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function countNoteWords(html: string) {
  const text = stripNoteHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
