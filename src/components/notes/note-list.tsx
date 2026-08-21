import Link from "next/link";
import { BookOpen, FileText, NotebookPen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

type NoteListProps = {
  notes: Note[];
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NoteList({ notes }: NoteListProps) {
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
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Recent{" "}
        <span className="tabular-nums text-foreground">{notes.length}</span>
      </p>
      <ul className="border-t border-border/60">
        {notes.map((note) => {
          const preview = stripHtml(note.content);
          const Icon = note.type === "journal" ? BookOpen : FileText;
          const isJournal = note.type === "journal";

          return (
            <li key={note.id} className="border-b border-border/50">
              <Link
                href={`/notes/${note.id}`}
                className="flex items-start gap-3 py-3.5 transition-colors hover:bg-muted/40"
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                    isJournal
                      ? "bg-sky-500/10 text-sky-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-medium leading-snug">
                      {note.title || "Untitled"}
                    </h3>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {note.type}
                    </span>
                  </div>
                  {preview ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {preview}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted-foreground">
                      Empty
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Updated {formatUpdated(note.updated_at)}
                    {note.journal_date ? ` · ${note.journal_date}` : null}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
