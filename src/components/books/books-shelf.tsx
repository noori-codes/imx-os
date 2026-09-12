"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Pencil, Search, Trash2 } from "lucide-react";

import {
  deleteBook,
  updateBookProgress,
  updateBookStatus,
} from "@/actions/books";
import { BookFormDialog } from "@/components/books/book-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { confirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  BOOK_STATUSES,
  bookProgressPercent,
  bookStatusLabel,
  type Book,
  type BookStatus,
} from "@/types/book";

type Filter = "all" | BookStatus;

type BooksShelfProps = {
  books: Book[];
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: BookStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
        status === "reading" &&
          "bg-foreground/10 text-foreground",
        status === "finished" &&
          "bg-muted text-muted-foreground",
        status === "want_to_read" &&
          "bg-muted/70 text-muted-foreground",
        status === "abandoned" &&
          "bg-destructive/10 text-destructive",
      )}
    >
      {bookStatusLabel(status)}
    </span>
  );
}

function ProgressCell({ book }: { book: Book }) {
  const pct = bookProgressPercent(book);
  const label =
    book.total_pages != null
      ? `${book.current_page} / ${book.total_pages}`
      : book.current_page > 0
        ? `p. ${book.current_page}`
        : "—";

  return (
    <div className="min-w-[7rem]">
      <p className="text-xs tabular-nums text-muted-foreground">{label}</p>
      {pct != null ? (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className="text-xs tabular-nums text-foreground" title={`${rating}/5`}>
      {"★".repeat(rating)}
      <span className="text-muted-foreground/40">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

export function BooksShelf({ books }: BooksShelfProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Book | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      if (filter !== "all" && book.status !== filter) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        (book.author?.toLowerCase().includes(q) ?? false) ||
        (book.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [books, filter, query]);

  function onStatusChange(bookId: string, status: BookStatus) {
    startTransition(async () => {
      await updateBookStatus(bookId, status);
    });
  }

  function onProgressSubmit(bookId: string, value: string) {
    const page = Number.parseInt(value, 10);
    if (!Number.isFinite(page) || page < 0) return;
    startTransition(async () => {
      await updateBookProgress(bookId, page);
    });
  }

  async function onDelete(book: Book) {
    const ok = await confirm({
      title: `Delete “${book.title}”?`,
      description: "This removes the book from your shelf.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteBook(book.id);
    });
  }

  if (books.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <BookFormDialog />
        </div>
        <EmptyState
          icon={BookOpen}
          title="Your shelf is empty"
          description="Add a book you're reading, finished, or want to start next."
        />
      </div>
    );
  }

  return (
    <section className="books-shelf space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex max-w-full flex-wrap rounded-xl border border-border/60 bg-card/70 p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {BOOK_STATUSES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === item.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block min-w-0 flex-1 sm:w-56 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shelf…"
              className="h-9 w-full rounded-xl border border-border/60 bg-card/70 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
            />
          </label>
          <BookFormDialog />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-5 py-10 text-center text-sm text-muted-foreground">
          Nothing matches that filter.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/50 bg-card/80 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/40 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book) => (
                  <tr
                    key={book.id}
                    className="border-b border-border/30 last:border-b-0"
                  >
                    <td className="max-w-[14rem] px-4 py-3">
                      <p className="truncate font-medium text-foreground">
                        {book.title}
                      </p>
                    </td>
                    <td className="max-w-[10rem] px-4 py-3 text-muted-foreground">
                      <span className="truncate block">
                        {book.author || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={book.status}
                        onChange={(event) =>
                          onStatusChange(
                            book.id,
                            event.target.value as BookStatus,
                          )
                        }
                        className="h-8 max-w-[9.5rem] rounded-md border border-border/50 bg-transparent px-2 text-xs outline-none"
                        aria-label={`Status for ${book.title}`}
                      >
                        {BOOK_STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressCell book={book} />
                        {book.status === "reading" ||
                        book.status === "want_to_read" ? (
                          <input
                            type="number"
                            min={0}
                            max={book.total_pages ?? undefined}
                            defaultValue={book.current_page}
                            key={`${book.id}-${book.current_page}`}
                            onBlur={(event) =>
                              onProgressSubmit(book.id, event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                (event.target as HTMLInputElement).blur();
                              }
                            }}
                            className="h-8 w-16 rounded-md border border-border/50 bg-transparent px-2 text-xs tabular-nums outline-none"
                            aria-label={`Current page for ${book.title}`}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RatingStars rating={book.rating} />
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                      {formatUpdated(book.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(book)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${book.title}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(book)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          aria-label={`Delete ${book.title}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="grid gap-3 md:hidden">
            {filtered.map((book) => (
              <li
                key={book.id}
                className="rounded-2xl border border-border/50 bg-card/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {book.title}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {book.author || "Unknown author"}
                    </p>
                  </div>
                  <StatusBadge status={book.status} />
                </div>

                <div className="mt-3">
                  <ProgressCell book={book} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={book.status}
                    onChange={(event) =>
                      onStatusChange(
                        book.id,
                        event.target.value as BookStatus,
                      )
                    }
                    className="h-8 flex-1 rounded-md border border-border/50 bg-transparent px-2 text-xs outline-none"
                    aria-label={`Status for ${book.title}`}
                  >
                    {BOOK_STATUSES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {(book.status === "reading" ||
                    book.status === "want_to_read") && (
                    <input
                      type="number"
                      min={0}
                      max={book.total_pages ?? undefined}
                      defaultValue={book.current_page}
                      key={`${book.id}-m-${book.current_page}`}
                      onBlur={(event) =>
                        onProgressSubmit(book.id, event.target.value)
                      }
                      className="h-8 w-16 rounded-md border border-border/50 bg-transparent px-2 text-xs tabular-nums outline-none"
                      aria-label={`Current page for ${book.title}`}
                    />
                  )}
                  <RatingStars rating={book.rating} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    Updated {formatUpdated(book.updated_at)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(book)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${book.title}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(book)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label={`Delete ${book.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing ? (
        <BookFormDialog
          book={editing}
          open={Boolean(editing)}
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}
