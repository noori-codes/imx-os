import { Suspense } from "react";
import type { Metadata } from "next";

import { getNotes, getTodayJournal } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteLibrary } from "@/components/notes/note-library";
import { NotesPulse } from "@/components/notes/notes-pulse";
import { NotesSkeleton } from "@/components/notes/notes-skeleton";
import { NotesStage } from "@/components/notes/notes-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes library and journaling",
};

async function NotesBody() {
  const [notes, todayJournal] = await Promise.all([
    getNotes(),
    getTodayJournal(),
  ]);

  const journals = notes.filter((note) => note.type === "journal").length;
  const plainNotes = notes.length - journals;
  const words = notes.reduce((sum, note) => sum + note.word_count, 0);

  return (
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <NotesStage>
        <div className="notes-reveal">
          <NotesPulse
            journal={todayJournal}
            noteCount={plainNotes}
            journalCount={journals}
            words={words}
          />
        </div>

        <div className="notes-reveal notes-reveal-delay-1">
          <NoteLibrary notes={notes} />
        </div>
      </NotesStage>
    </AppPageFrame>
  );
}

export default function NotesPage() {
  return (
    <>
      <Header chrome title="Notes" />
      <Suspense fallback={<NotesSkeleton />}>
        <NotesBody />
      </Suspense>
    </>
  );
}
