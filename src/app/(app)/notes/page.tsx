import { getNotes, getTodayJournal } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteActions } from "@/components/notes/note-actions";
import { NoteJournalSpotlight } from "@/components/notes/note-journal-spotlight";
import { NoteLibrary } from "@/components/notes/note-library";
import { NoteStats } from "@/components/notes/note-stats";
import { NotesStage } from "@/components/notes/notes-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { countNoteWords } from "@/lib/note-preview";

export default async function NotesPage() {
  const [notes, todayJournal] = await Promise.all([
    getNotes(),
    getTodayJournal(),
  ]);

  const journals = notes.filter((note) => note.type === "journal").length;
  const plainNotes = notes.length - journals;
  const words = notes.reduce(
    (sum, note) => sum + countNoteWords(note.content),
    0,
  );

  return (
    <>
      <Header title="Notes" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <NotesStage>
          <div className="notes-reveal">
            <NoteActions hasTodayJournal={Boolean(todayJournal)} />
          </div>

          <div className="notes-reveal notes-reveal-delay-1">
            <NoteStats
              total={notes.length}
              notes={plainNotes}
              journals={journals}
              words={words}
            />
          </div>

          <div className="notes-reveal notes-reveal-delay-2">
            <NoteJournalSpotlight journal={todayJournal} />
          </div>

          <div className="notes-reveal notes-reveal-delay-3">
            <NoteLibrary notes={notes} />
          </div>
        </NotesStage>
      </AppPageFrame>
    </>
  );
}
