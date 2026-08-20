"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteNote, updateNote, type NoteActionState } from "@/actions/notes";
import { RichTextEditor } from "@/components/notes/rich-text-editor";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types/note";

type NoteEditorProps = {
  note: Note;
};

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(note.content);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const updateForNote = updateNote.bind(null, note.id);
  const [state, formAction, pending] = useActionState<
    NoteActionState | null,
    FormData
  >(updateForNote, null);

  useEffect(() => {
    if (state && !state.error) {
      setSavedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/95 shadow-[0_1px_0_rgba(255,255,255,0.03)]"
    >
      <input type="hidden" name="content" value={content} />

      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {note.type === "journal" ? "Journal" : "Note"}
          </p>
          {note.journal_date ? (
            <span className="rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {note.journal_date}
            </span>
          ) : null}
        </div>
        <input
          id="note-title"
          name="title"
          defaultValue={note.title}
          placeholder="Untitled"
          aria-label="Title"
          className="mt-3 w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="px-2 py-2 sm:px-3 sm:py-3">
        <RichTextEditor
          content={note.content}
          onChange={setContent}
          placeholder={
            note.type === "journal"
              ? "How was today? What went well?"
              : "Start writing…"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 px-5 py-4 sm:px-6">
        <Button type="submit" disabled={pending} className="h-9 rounded-full px-5">
          {pending ? "Saving…" : "Save"}
        </Button>

        <Button
          type="submit"
          variant="outline"
          formAction={deleteNote.bind(null, note.id)}
          className="h-9 rounded-full border-border/70 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>

        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}

        {savedAt && !state?.error ? (
          <p className="text-sm text-muted-foreground">Saved at {savedAt}</p>
        ) : null}
      </div>
    </form>
  );
}
