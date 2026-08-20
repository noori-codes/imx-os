import { getNotes, getTodayJournal } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteActions } from "@/components/notes/note-actions";
import { NoteList } from "@/components/notes/note-list";
import { NoteStats } from "@/components/notes/note-stats";
import { NotesPageFrame } from "@/components/notes/notes-page-frame";

export default async function NotesPage() {
  const [notes, todayJournal] = await Promise.all([
    getNotes(),
    getTodayJournal(),
  ]);

  const journals = notes.filter((note) => note.type === "journal").length;
  const plainNotes = notes.length - journals;

  return (
    <>
      <Header title="Notes" description="Notes and journaling" />
      <NotesPageFrame>
        <div className="mx-auto w-full max-w-4xl">
          <NoteActions hasTodayJournal={Boolean(todayJournal)} />
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <NoteStats
            total={notes.length}
            notes={plainNotes}
            journals={journals}
          />
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <NoteList notes={notes} />
        </div>
      </NotesPageFrame>
    </>
  );
}
