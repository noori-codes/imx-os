"use client";

import dynamic from "next/dynamic";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteNote, updateNote, type NoteActionState } from "@/actions/notes";
import { countNoteWords } from "@/lib/note-preview";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

const RichTextEditor = dynamic(
  () =>
    import("@/components/notes/rich-text-editor").then((m) => ({
      default: m.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="imx-skeleton min-h-80 rounded-2xl border border-border/40 p-4"
        role="status"
        aria-label="Loading editor"
      >
        <div className="imx-skeleton-bone mb-3 h-8 w-40 rounded-md" />
        <div className="imx-skeleton-bone h-48 w-full rounded-lg" />
      </div>
    ),
  },
);

type NoteEditorProps = {
  note: Note;
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [manualPending, startManual] = useTransition();
  const baseline = useRef({ title: note.title, content: note.content });
  const skipAutosave = useRef(true);

  const updateForNote = updateNote.bind(null, note.id);
  const [state, formAction, pending] = useActionState<
    NoteActionState | null,
    FormData
  >(updateForNote, null);

  const words = countNoteWords(content);
  const isJournal = note.type === "journal";
  const busy = pending || manualPending || status === "saving";

  const markSaved = useEffectEvent((nextTitle: string, nextContent: string) => {
    baseline.current = { title: nextTitle, content: nextContent };
    setStatus("saved");
    setSavedAt(
      new Date().toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
    );
  });

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    baseline.current = { title: note.title, content: note.content };
    skipAutosave.current = true;
    setStatus("idle");
    setSavedAt(null);
    // Only remount local draft when navigating to a different note.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- note.id is the intentional gate
  }, [note.id]);

  useEffect(() => {
    if (state && !state.error) {
      markSaved(title, content);
      router.refresh();
    } else if (state?.error) {
      setStatus("error");
    }
  }, [state, router, title, content, markSaved]);

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }

    const dirty =
      title !== baseline.current.title || content !== baseline.current.content;
    if (!dirty) return;

    setStatus("dirty");
    const timer = window.setTimeout(() => {
      startManual(async () => {
        setStatus("saving");
        const formData = new FormData();
        formData.set("title", title);
        formData.set("content", content);
        const result = await updateNote(note.id, null, formData);
        if (result.error) {
          setStatus("error");
          return;
        }
        markSaved(title, content);
        router.refresh();
      });
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [title, content, note.id, router, markSaved]);

  const statusLabel =
    status === "saving" || busy
      ? "Saving…"
      : status === "dirty"
        ? "Unsaved changes"
        : status === "error"
          ? "Couldn’t save"
          : savedAt
            ? `Saved · ${savedAt}`
            : "All changes saved";

  return (
    <form
      action={formAction}
      className={cn(
        "notes-editor overflow-hidden rounded-2xl border border-border/50 bg-card/80",
        isJournal && "border-amber-500/20",
      )}
    >
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="title" value={title} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4 sm:px-6">
        <div>
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.14em]",
              isJournal
                ? "text-amber-800/80 dark:text-amber-300/90"
                : "text-muted-foreground",
            )}
          >
            {isJournal ? "Journal" : "Note"}
            {note.journal_date ? (
              <span className="ml-2 tabular-nums text-muted-foreground">
                {note.journal_date}
              </span>
            ) : null}
          </p>
          <p
            className={cn(
              "mt-1 text-xs",
              status === "error"
                ? "text-destructive"
                : status === "dirty"
                  ? "text-foreground/70"
                  : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {statusLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
            {words} word{words === 1 ? "" : "s"}
          </span>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="submit"
            formAction={deleteNote.bind(null, note.id)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-card/70 px-3 text-sm font-medium text-destructive transition-colors hover:border-destructive/40"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 sm:px-8 sm:pt-7">
        <input
          id="note-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled"
          aria-label="Title"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 sm:text-3xl"
        />
      </div>

      <div className="px-2 pb-2 sm:px-4 sm:pb-4">
        <RichTextEditor
          key={note.id}
          content={note.content}
          onChange={setContent}
          placeholder={
            isJournal
              ? "How was today? What went well?"
              : "Start writing…"
          }
        />
      </div>

      {state?.error ? (
        <p className="border-t border-border/40 px-5 py-3 text-sm text-destructive sm:px-6">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-border/40 px-5 py-3 text-xs text-muted-foreground sm:px-6 sm:hidden">
        <span className="tabular-nums">
          {words} word{words === 1 ? "" : "s"}
        </span>
        <span>{statusLabel}</span>
      </div>
    </form>
  );
}
