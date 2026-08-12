import { getNotes, getTodayJournal } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteActions } from "@/components/notes/note-actions";
import { NoteList } from "@/components/notes/note-list";

export default async function NotesPage() {
  const [notes, todayJournal] = await Promise.all([
    getNotes(),
    getTodayJournal(),
  ]);

  return (
    <>
      <Header title="Notes" description="Notes and journaling" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <NoteActions hasTodayJournal={Boolean(todayJournal)} />
        <NoteList notes={notes} />
      </div>
    </>
  );
}
