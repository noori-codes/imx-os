import { notFound } from "next/navigation";

import { getNote } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesStage } from "@/components/notes/notes-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
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
      <Header title={note.type === "journal" ? "Journal" : "Note"} />
      <AppPageFrame className="max-w-3xl gap-6 md:py-8">
        <NotesStage>
          <div className="notes-reveal">
            <Breadcrumbs
              items={[
                { label: "Notes", href: "/notes" },
                { label: note.title || "Untitled" },
              ]}
            />
          </div>
          <div className="notes-reveal notes-reveal-delay-1">
            <NoteEditor note={note} />
          </div>
        </NotesStage>
      </AppPageFrame>
    </>
  );
}
