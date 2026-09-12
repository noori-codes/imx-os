import { BookOpen, Plus } from "lucide-react";

import { createNote } from "@/actions/notes";

type NoteActionsProps = {
  hasTodayJournal: boolean;
};

export function NoteActions({ hasTodayJournal }: NoteActionsProps) {
  return (
    <header className="notes-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Writing studio</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Notes
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
          Freeform notes and one journal a day — your thinking shelf.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form action={createNote.bind(null, "note")}>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            New note
          </button>
        </form>
        <form action={createNote.bind(null, "journal")}>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
          >
            <BookOpen className="size-4" />
            {hasTodayJournal ? "Today's journal" : "Start journal"}
          </button>
        </form>
      </div>
    </header>
  );
}
