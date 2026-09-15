import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getNote } from "@/actions/notes";
import { Header } from "@/components/layout/header";
import { NoteDetailSkeleton } from "@/components/notes/note-detail-skeleton";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesStage } from "@/components/notes/notes-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

type NoteDetailPageProps = {
  params: Promise<{ noteId: string }>;
};

export async function generateMetadata({
  params,
}: NoteDetailPageProps): Promise<Metadata> {
  const { noteId } = await params;
  const note = await getNote(noteId);
  if (!note) return { title: "Note" };
  const title = note.title?.trim() || "Untitled";
  return {
    title,
    description:
      note.type === "journal" && note.journal_date
        ? `Journal · ${note.journal_date}`
        : "Note",
  };
}

async function NoteDetailBody({ noteId }: { noteId: string }) {
  const note = await getNote(noteId);

  if (!note) {
    notFound();
  }

  const displayTitle = note.title?.trim() || "Untitled";
  const kind = note.type === "journal" ? "Journal" : "Note";

  return (
    <>
      <Header
        chrome
        title={displayTitle}
        description={
          note.type === "journal" && note.journal_date
            ? `Journal · ${note.journal_date}`
            : kind
        }
      />
      <AppPageFrame className="max-w-3xl gap-6 md:py-8">
        <NotesStage>
          <div className="notes-reveal flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: "Notes", href: "/notes" },
                { label: displayTitle },
              ]}
            />
            <Link
              href="/notes"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/55 bg-card/70 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Library
            </Link>
          </div>
          <div className="notes-reveal notes-reveal-delay-1">
            <NoteEditor note={note} />
          </div>
        </NotesStage>
      </AppPageFrame>
    </>
  );
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { noteId } = await params;

  return (
    <Suspense fallback={<NoteDetailSkeleton />}>
      <NoteDetailBody noteId={noteId} />
    </Suspense>
  );
}
