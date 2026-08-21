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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="content" value={content} />

      <div className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{note.type === "journal" ? "Journal" : "Note"}</span>
          {note.journal_date ? (
            <>
              <span className="text-border">·</span>
              <span className="tabular-nums">{note.journal_date}</span>
            </>
          ) : null}
        </div>
        <input
          id="note-title"
          name="title"
          defaultValue={note.title}
          placeholder="Untitled"
          aria-label="Title"
          className="mt-2 w-full bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <RichTextEditor
        content={note.content}
        onChange={setContent}
        placeholder={
          note.type === "journal"
            ? "How was today? What went well?"
            : "Start writing…"
        }
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
        <Button type="submit" disabled={pending} size="sm" className="h-9">
          {pending ? "Saving…" : "Save"}
        </Button>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          formAction={deleteNote.bind(null, note.id)}
          className="h-9 text-destructive hover:text-destructive"
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
