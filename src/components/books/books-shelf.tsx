"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Pencil, Search, Trash2 } from "lucide-react";

import {
  deleteBook,
  updateBookProgress,
  updateBookRating,
  updateBookStatus,
} from "@/actions/books";
import { BookFormDialog } from "@/components/books/book-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { BrandSelect } from "@/components/ui/brand-select";
import { confirm } from "@/components/ui/confirm-dialog";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";
import {
  BOOK_STATUSES,
  bookProgressPercent,
  bookReadingDays,
  bookStatusLabel,
  formatBookReadingDays,
  type Book,
  type BookStatus,
} from "@/types/book";

type Filter = "all" | BookStatus;

type BooksShelfProps = {
  books: Book[];
  /** From ⌘K “Add book” — open the create dialog once. */
  compose?: boolean;
};

function formatShortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function bookMetaLine(book: Book) {
  const days = bookReadingDays(book);
  const daysLabel = formatBookReadingDays(days);

  if (!book.started_at && !book.finished_at) {
    return null;
  }

  const range = [
    book.started_at ? formatShortDate(book.started_at) : null,
    book.finished_at
      ? formatShortDate(book.finished_at)
      : book.status === "reading" && book.started_at
        ? "now"
        : null,
  ]
    .filter(Boolean)
    .join(" → ");

  if (daysLabel && book.status === "finished") {
    return `${range} · finished in ${daysLabel}`;
  }
  if (daysLabel && book.status === "reading") {
    return `${range} · ${daysLabel} so far`;
  }
  if (daysLabel) {
    return `${range} · ${daysLabel}`;
  }
  return range || null;
}

function ProgressBar({ book }: { book: Book }) {
  const pct = bookProgressPercent(book);
  const label =
    book.total_pages != null
      ? `${book.current_page} / ${book.total_pages}`
      : book.current_page > 0
        ? `p. ${book.current_page}`
        : null;

  if (pct == null && !label) return null;

  return (
    <div className="min-w-0 flex-1 sm:max-w-[11rem]">
      {label ? (
        <p className="text-[11px] tabular-nums text-muted-foreground">{label}</p>
      ) : null}
      {pct != null ? (
        <div
          className={cn(
            "mt-1 h-1.5 overflow-hidden rounded-full bg-muted",
            book.status === "reading" && "bg-muted/80",
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              book.status === "reading"
                ? "bg-foreground/80"
                : "bg-foreground/55",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function RatingStars({
  rating,
  bookTitle,
  onRate,
}: {
  rating: number | null;
  bookTitle: string;
  onRate: (next: number | null) => void;
}) {
  const value = rating ?? 0;
  return (
    <div
      className="inline-flex items-center gap-0.5"
      role="group"
      aria-label={`Rating for ${bookTitle}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onRate(rating === star ? null : star)}
            className={cn(
              "rounded px-0.5 text-sm leading-none transition-colors",
              filled
                ? "text-foreground"
                : "text-muted-foreground/35 hover:text-muted-foreground",
            )}
            aria-label={
              rating === star
                ? `Clear rating (${star} stars)`
                : `Rate ${star} star${star === 1 ? "" : "s"}`
            }
            aria-pressed={filled}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function BookRow({
  book,
  index,
  onStatusChange,
  onProgressSubmit,
  onRate,
  onEdit,
  onDelete,
}: {
  book: Book;
  index: number;
  onStatusChange: (bookId: string, status: BookStatus) => void;
  onProgressSubmit: (bookId: string, value: string) => void;
  onRate: (bookId: string, next: number | null) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}) {
  const meta = bookMetaLine(book);
  const showPageInput =
    book.status === "reading" || book.status === "want_to_read";

  return (
    <li
      id={`book-${book.id}`}
      className={cn(
        "books-card group/book relative scroll-mt-24 overflow-hidden rounded-2xl imx-surface imx-surface-rim",
        book.status === "finished" && "books-card-finished",
        book.status === "abandoned" && "books-card-abandoned",
      )}
      style={{ ["--i" as string]: index }}
    >
      <span
        className={cn(
          "books-card-spine absolute inset-y-3 left-0 w-0.5 rounded-full",
          book.status === "reading" && "books-card-spine-reading",
          book.status === "finished" && "books-card-spine-finished",
          book.status === "want_to_read" && "books-card-spine-queue",
          book.status === "abandoned" && "books-card-spine-abandoned",
        )}
        aria-hidden
      />

      <div className="flex flex-col gap-3 p-4 pl-4 sm:flex-row sm:items-start sm:gap-4 sm:pl-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-tight text-foreground">
                {book.title}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {book.author || "Unknown author"}
              </p>
              {meta ? (
                <p className="mt-1.5 text-[11px] leading-relaxed tabular-nums text-muted-foreground">
                  {meta}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:hidden">
              <button
                type="button"
                onClick={() => onEdit(book)}
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
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <BrandSelect
              size="sm"
              value={book.status}
              aria-label={`Status for ${book.title}`}
              className="w-[9.5rem] shrink-0 bg-transparent"
              options={BOOK_STATUSES.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onValueChange={(next) =>
                onStatusChange(book.id, next as BookStatus)
              }
            />

            <ProgressBar book={book} />

            {showPageInput ? (
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
                className="h-8 w-14 shrink-0 rounded-lg border border-border/50 bg-transparent px-2 text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Current page for ${book.title}`}
              />
            ) : null}

            <RatingStars
              rating={book.rating}
              bookTitle={book.title}
              onRate={(next) => onRate(book.id, next)}
            />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
          <button
            type="button"
            onClick={() => onEdit(book)}
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
      </div>
    </li>
  );
}

export function BooksShelf({ books, compose = false }: BooksShelfProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Book | null>(null);
  const [creating, setCreating] = useState(compose);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!compose) return;
    setCreating(true);
    const params = new URLSearchParams(window.location.search);
    params.delete("compose");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [compose, pathname, router]);

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

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id.startsWith("book-")) return;
    window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [filtered.length]);

  function onStatusChange(bookId: string, status: BookStatus) {
    const book = books.find((item) => item.id === bookId);
    startTransition(async () => {
      await updateBookStatus(bookId, status);
      if (status === "finished") {
        imxToast("Finished", {
          description: book?.title,
          tone: "success",
        });
      } else {
        imxToast("Status updated", {
          description: book
            ? `${book.title} · ${bookStatusLabel(status)}`
            : undefined,
        });
      }
    });
  }

  function onProgressSubmit(bookId: string, value: string) {
    const page = Number.parseInt(value, 10);
    if (!Number.isFinite(page) || page < 0) return;
    const book = books.find((item) => item.id === bookId);
    const finished =
      book?.total_pages != null &&
      book.total_pages > 0 &&
      page >= book.total_pages;
    startTransition(async () => {
      await updateBookProgress(bookId, page);
      if (finished) {
        imxToast("Finished", {
          description: book?.title,
          tone: "success",
        });
      } else {
        imxToast("Progress saved", {
          description: book
            ? `${book.title} · p.${page}${book.total_pages ? `/${book.total_pages}` : ""}`
            : undefined,
        });
      }
    });
  }

  function onRate(bookId: string, next: number | null) {
    const book = books.find((item) => item.id === bookId);
    startTransition(async () => {
      const result = await updateBookRating(bookId, next);
      if (result.error) {
        imxToast("Couldn’t update rating", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast(
        next == null
          ? "Rating cleared"
          : `${next} star${next === 1 ? "" : "s"}`,
        {
          description: book?.title,
          tone: "success",
        },
      );
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
      imxToast("Book deleted", { tone: "success" });
    });
  }

  if (books.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Your shelf is empty"
        description="Add a book you're reading, finished, or want to start next."
        className="py-16"
      >
        <div className="mt-5">
          <BookFormDialog />
        </div>
      </EmptyState>
    );
  }

  return (
    <section className="books-shelf space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex max-w-full flex-wrap rounded-xl border border-border/40 bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-foreground text-background dark:bg-foreground/12 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
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
                  ? "bg-foreground text-background dark:bg-foreground/12 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
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
              className="h-9 w-full rounded-xl border border-surface-border bg-surface pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
            />
          </label>
          <BookFormDialog />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing matches that filter."
          description="Clear search or switch tabs to see more of your shelf."
          className="py-10"
        >
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            className="mt-5 inline-flex h-10 items-center rounded-xl border border-surface-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
          >
            Reset filters
          </button>
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((book, index) => (
            <BookRow
              key={book.id}
              book={book}
              index={index}
              onStatusChange={onStatusChange}
              onProgressSubmit={onProgressSubmit}
              onRate={onRate}
              onEdit={setEditing}
              onDelete={(item) => void onDelete(item)}
            />
          ))}
        </ul>
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

      {creating && !editing ? (
        <BookFormDialog
          open={creating}
          onOpenChange={(next) => {
            if (!next) setCreating(false);
          }}
        />
      ) : null}
    </section>
  );
}
