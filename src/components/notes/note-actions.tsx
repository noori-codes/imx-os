import { BookOpen, Plus } from "lucide-react";

import { createNote } from "@/actions/notes";

type NoteActionsProps = {
  hasTodayJournal: boolean;
};

export function NoteActions({ hasTodayJournal }: NoteActionsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
      <form action={createNote.bind(null, "note")} className="h-full">
        <button
          type="submit"
          className="group flex h-full w-full flex-col rounded-[1.75rem] border border-border/60 bg-card/95 p-5 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:bg-muted/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Capture
              </p>
              <h2 className="mt-1 text-base font-semibold">New note</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start a blank page for ideas, drafts, or plans.
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:scale-[1.03]">
              <Plus className="size-4" />
            </span>
          </div>
        </button>
      </form>

      <form action={createNote.bind(null, "journal")} className="h-full">
        <button
          type="submit"
          className="group flex h-full w-full flex-col rounded-[1.75rem] border border-border/60 bg-card/95 p-5 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:bg-muted/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Reflect
              </p>
              <h2 className="mt-1 text-base font-semibold">
                {hasTodayJournal ? "Open today's journal" : "Today's journal"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasTodayJournal
                  ? "Continue the entry you already started today."
                  : "One page a day for what went well and what you noticed."}
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/35 text-foreground transition-transform group-hover:scale-[1.03]">
              <BookOpen className="size-4" />
            </span>
          </div>
        </button>
      </form>
    </div>
  );
}
