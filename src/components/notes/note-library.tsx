"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, FileText, NotebookPen, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { stripNoteHtml } from "@/lib/note-preview";
import { cn } from "@/lib/utils";
import type { Note, NoteType } from "@/types/note";

type Filter = "all" | NoteType;

type NoteLibraryProps = {
  notes: Note[];
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatJournalDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function NoteLibrary({ notes }: NoteLibraryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (filter !== "all" && note.type !== filter) return false;
      if (!q) return true;
      const preview = stripNoteHtml(note.content).toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        preview.includes(q) ||
        (note.journal_date?.includes(q) ?? false)
      );
    });
  }, [notes, filter, query]);

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Create a note or open today's journal to start writing."
      />
    );
  }

  return (
    <section className="notes-library space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-border/60 bg-card/70 p-1">
          {(
            [
              { id: "all", label: "All" },
              { id: "note", label: "Notes" },
              { id: "journal", label: "Journals" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="relative block min-w-0 sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search library…"
            className="h-9 w-full rounded-xl border border-border/60 bg-card/70 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-5 py-10 text-center text-sm text-muted-foreground">
          Nothing matches that filter.
        </p>
      ) : (
        <ul className="notes-grid grid gap-3 sm:grid-cols-2">
          {filtered.map((note, index) => {
            const preview = stripNoteHtml(note.content);
            const isJournal = note.type === "journal";
            const Icon = isJournal ? BookOpen : FileText;

            return (
              <li
                key={note.id}
                className="notes-card-wrap"
                style={{ ["--i" as string]: index }}
              >
                <Link
                  href={`/notes/${note.id}`}
                  className={cn(
                    "notes-card group flex h-full flex-col rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-border hover:bg-card sm:p-5",
                    isJournal && "border-amber-500/20 hover:border-amber-500/35",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-xl",
                        isJournal
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {isJournal ? "Journal" : "Note"}
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-base font-semibold tracking-tight text-foreground">
                    {note.title || "Untitled"}
                  </h3>

                  <p
                    className={cn(
                      "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground",
                      !preview && "italic",
                    )}
                  >
                    {preview || "Empty — open to write"}
                  </p>

                  <p className="mt-4 text-xs tabular-nums text-muted-foreground">
                    {isJournal && note.journal_date
                      ? formatJournalDate(note.journal_date)
                      : `Updated ${formatUpdated(note.updated_at)}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
