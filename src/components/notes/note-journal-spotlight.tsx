import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

import { createNote } from "@/actions/notes";
import { stripNoteHtml } from "@/lib/note-preview";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

type NoteJournalSpotlightProps = {
  journal: Note | null;
};

export function NoteJournalSpotlight({ journal }: NoteJournalSpotlightProps) {
  const preview = journal ? stripNoteHtml(journal.content) : "";
  const hasWriting = preview.length > 0;

  return (
    <section
      className={cn(
        "notes-spotlight overflow-hidden rounded-2xl border border-border/50",
        journal
          ? "border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card/80 to-card/80"
          : "bg-card/80",
      )}
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-800/80 dark:text-amber-300/90">
            <BookOpen className="size-3.5" />
            Today&apos;s journal
          </p>
          {journal ? (
            <>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {journal.title || "Today"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {hasWriting
                  ? preview.length > 160
                    ? `${preview.slice(0, 160).trim()}…`
                    : preview
                  : "Opened — waiting for your first line."}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Capture the day
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                One journal per day. Show up for a few honest lines — it
                surfaces on Calendar and Review too.
              </p>
            </>
          )}
        </div>

        <div className="shrink-0">
          {journal ? (
            <Link
              href={`/notes/${journal.id}`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {hasWriting ? "Continue writing" : "Start writing"}
            </Link>
          ) : (
            <form action={createNote.bind(null, "journal")}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" />
                Open today&apos;s journal
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
