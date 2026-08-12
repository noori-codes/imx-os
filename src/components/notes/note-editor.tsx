"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteNote, updateNote, type NoteActionState } from "@/actions/notes";
import { RichTextEditor } from "@/components/notes/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          name="title"
          defaultValue={note.title}
          placeholder="Untitled"
          className="text-lg font-semibold"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Content</Label>
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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>

        <Button
          type="submit"
          variant="outline"
          formAction={deleteNote.bind(null, note.id)}
          className="text-destructive hover:text-destructive"
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
