import { BookOpen, Plus } from "lucide-react";

import { createNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";

type NoteActionsProps = {
  hasTodayJournal: boolean;
};

export function NoteActions({ hasTodayJournal }: NoteActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/60 pb-5">
      <form action={createNote.bind(null, "note")}>
        <Button type="submit">
          <Plus className="size-4" />
          New note
        </Button>
      </form>

      <form action={createNote.bind(null, "journal")}>
        <Button type="submit" variant="outline">
          <BookOpen className="size-4" />
          {hasTodayJournal ? "Open today's journal" : "Today's journal"}
        </Button>
      </form>
    </div>
  );
}
