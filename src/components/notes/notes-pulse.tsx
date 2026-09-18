import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

import { CreateNoteButton } from "@/components/notes/create-note-button";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import type { NoteListItem } from "@/types/note";

type NotesPulseProps = {
  journal: NoteListItem | null;
  noteCount: number;
  journalCount: number;
  words: number;
};

function formatWords(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

function pulseCopy(journal: NoteListItem | null) {
  const preview = journal?.preview ?? "";
  const hasWriting = preview.length > 0;

  if (!journal) {
    return {
      title: "Capture the day",
      body: "One journal per day. Show up for a few honest lines — it surfaces on Calendar and Review too.",
      sealed: false,
      progress: 0,
      ringLabel: "today",
    };
  }

  if (!hasWriting) {
    return {
      title: journal.title || "Today’s journal",
      body: "Opened — waiting for your first line.",
      sealed: false,
      progress: 35,
      ringLabel: "open",
    };
  }

  return {
    title: journal.title || "Today’s journal",
    body:
      preview.length > 140
        ? `${preview.slice(0, 140).trim()}…`
        : preview,
    sealed: true,
    progress: 100,
    ringLabel: "sealed",
  };
}

export function NotesPulse({
  journal,
  noteCount,
  journalCount,
  words,
}: NotesPulseProps) {
  const copy = pulseCopy(journal);
  const hasWriting = Boolean(journal?.preview);

  return (
    <section
      className={cn(
        "notes-pulse relative overflow-hidden rounded-[1.75rem] imx-surface px-5 py-6 sm:px-7 sm:py-8",
        journal && "notes-pulse-journal",
        copy.sealed && "notes-pulse-sealed",
      )}
    >
      <div className="notes-pulse-vignette" aria-hidden />
      <div className="notes-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Writing studio
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Notes
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <CreateNoteButton
              type="note"
              label="New note"
              icon="plus"
              tone="outline"
              capture
            />
            {journal ? (
              <Link
                href={`/notes/${journal.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <BookOpen className="size-4" />
                {hasWriting ? "Continue" : "Write"}
                <ArrowUpRight className="size-3.5 opacity-70" />
              </Link>
            ) : (
              <CreateNoteButton
                type="journal"
                label="Start journal"
                icon="book"
                tone="primary"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-800/80 dark:text-amber-300/90">
              <BookOpen className="size-3.5" />
              Today&apos;s journal
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
              {copy.body}
            </p>

            <div className="notes-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {noteCount > 0 ? noteCount : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Journals
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {journalCount > 0 ? journalCount : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Words
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {words > 0 ? formatWords(words) : "—"}
                </p>
              </div>
            </div>
          </div>

          <ProgressRing
            value={copy.progress}
            size={128}
            stroke={7}
            sealed={copy.sealed}
            featured
            className="mx-auto sm:mx-0"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {words > 0 ? formatWords(words) : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {copy.ringLabel}
              </p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
