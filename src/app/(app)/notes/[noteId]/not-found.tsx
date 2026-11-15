import Link from "next/link";

import { Header } from "@/components/layout/header";
import { NotesStage } from "@/components/notes/notes-stage";
import { EmptyState } from "@/components/shared/empty-state";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Button } from "@/components/ui/button";

export default function NoteNotFound() {
  return (
    <>
      <Header chrome title="Note" />
      <AppPageFrame>
        <NotesStage>
          <EmptyState
            glyph="note"
            title="Note not found"
            description="This note may have been deleted or you don’t have access."
            className="py-20"
          >
            <Button asChild className="mt-5">
              <Link href="/notes">Back to notes</Link>
            </Button>
          </EmptyState>
        </NotesStage>
      </AppPageFrame>
    </>
  );
}
