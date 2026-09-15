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

/** Split rich note HTML into task-ready lines (paragraphs / list items / breaks). */
export function noteContentToTaskLines(html: string) {
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const PREVIEW_MAX = 280;

/** Persistable list fields derived from rich HTML content. */
export function buildNoteListFields(html: string) {
  const text = stripNoteHtml(html);
  return {
    preview: text.slice(0, PREVIEW_MAX),
    word_count: text ? text.split(/\s+/).filter(Boolean).length : 0,
  };
}
