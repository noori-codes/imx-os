import { Header } from "@/components/layout/header";
import { NotesSkeleton } from "@/components/notes/notes-skeleton";

export default function NotesLoading() {
  return (
    <>
      <Header title="Notes" description="Notes and journaling" />
      <NotesSkeleton />
    </>
  );
}
