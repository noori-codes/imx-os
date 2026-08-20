import { notFound } from "next/navigation";

import { getNote } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesPageFrame } from "@/components/notes/notes-page-frame";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

type NoteDetailPageProps = {
  params: Promise<{ noteId: string }>;
};

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { noteId } = await params;
  const note = await getNote(noteId);

  if (!note) {
    notFound();
  }

  return (
    <>
      <Header
        title={note.type === "journal" ? "Journal" : "Note"}
        description={
          note.type === "journal" && note.journal_date
            ? `Daily journal · ${note.journal_date}`
            : "Edit and save your writing"
        }
      />
      <NotesPageFrame>
        <div className="mx-auto w-full max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "Notes", href: "/notes" },
              { label: note.title || "Untitled" },
            ]}
          />
          <NoteEditor note={note} />
        </div>
      </NotesPageFrame>
    </>
  );
}
