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

export function bookProgressPercent(book: Pick<Book, "current_page" | "total_pages">) {
  if (!book.total_pages || book.total_pages <= 0) return null;
  return Math.min(
    100,
    Math.round((book.current_page / book.total_pages) * 100),
  );
}
