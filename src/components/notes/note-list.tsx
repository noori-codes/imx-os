import Link from "next/link";
import { BookOpen, FileText, NotebookPen } from "lucide-react";

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
      <section className="rounded-[1.75rem] border border-border/60 bg-card/95 px-5 py-14 text-center shadow-[0_1px_0_rgba(255,255,255,0.03)] sm:px-6">
        <NotebookPen className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h2 className="text-base font-medium">No notes yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Create a note or open today&apos;s journal to start writing.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card/95 px-5 py-6 shadow-[0_1px_0_rgba(255,255,255,0.03)] sm:px-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Library
          </p>
          <h2 className="mt-1 text-base font-semibold">Recent writing</h2>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {notes.length}
        </span>
      </div>

      <ul className="space-y-1">
        {notes.map((note) => {
          const preview = stripHtml(note.content);
          const Icon = note.type === "journal" ? BookOpen : FileText;
          const isJournal = note.type === "journal";

          return (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="group flex items-start gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-muted/45"
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/60",
                    isJournal ? "bg-sky-500/10 text-sky-200" : "bg-muted/40 text-foreground/80",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold leading-snug">
                      {note.title || "Untitled"}
                    </h3>
                    <span className="rounded-full border border-border/70 bg-background/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {formatUpdated(note.updated_at)}
                    {note.journal_date ? ` · ${note.journal_date}` : null}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
