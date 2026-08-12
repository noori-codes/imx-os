import Link from "next/link";
import { BookOpen, FileText, NotebookPen } from "lucide-react";

import type { Note } from "@/types/note";

type NoteListProps = {
  notes: Note[];
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <NotebookPen className="mb-3 size-10 text-muted-foreground" />
        <h3 className="text-lg font-medium">No notes yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create a note or open today&apos;s journal to start writing.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => {
        const preview = stripHtml(note.content);
        const Icon = note.type === "journal" ? BookOpen : FileText;

        return (
          <li key={note.id}>
            <Link
              href={`/notes/${note.id}`}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold leading-snug">{note.title}</h3>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {note.type}
                  </span>
                </div>
                {preview ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {preview}
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    Empty
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatUpdated(note.updated_at)}
                  {note.journal_date ? ` · ${note.journal_date}` : null}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
