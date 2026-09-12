export type BookStatus =
  | "want_to_read"
  | "reading"
  | "finished"
  | "abandoned";

export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  current_page: number;
  total_pages: number | null;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const BOOK_STATUSES: {
  value: BookStatus;
  label: string;
}[] = [
  { value: "want_to_read", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
  { value: "abandoned", label: "Abandoned" },
];

export function bookStatusLabel(status: BookStatus) {
  return BOOK_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function bookProgressPercent(
  book: Pick<Book, "current_page" | "total_pages">,
) {
  if (!book.total_pages || book.total_pages <= 0) return null;
  return Math.min(
    100,
    Math.round((book.current_page / book.total_pages) * 100),
  );
}

/**
 * Inclusive days on the book: start→finish, or start→today while reading.
 * Returns null when there is no start date.
 */
export function bookReadingDays(
  book: Pick<Book, "started_at" | "finished_at" | "status">,
  today?: string,
): number | null {
  if (!book.started_at) return null;

  const todayLocal =
    today ??
    (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    })();

  const end =
    book.finished_at ??
    (book.status === "reading" || book.status === "abandoned"
      ? todayLocal
      : null);

  if (!end) return null;

  const startMs = Date.parse(`${book.started_at}T00:00:00`);
  const endMs = Date.parse(`${end}T00:00:00`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return null;
  }

  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export function formatBookReadingDays(days: number | null) {
  if (days == null) return null;
  return days === 1 ? "1 day" : `${days} days`;
}
