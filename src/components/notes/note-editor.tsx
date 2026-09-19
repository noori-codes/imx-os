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
import {
  Trash2,
  Link2,
  ListTodo,
  CalendarDays,
  Save,
} from "lucide-react";

import { createEventFromNote } from "@/actions/calendar";
import { deleteNote, updateNote, type NoteActionState } from "@/actions/notes";
import { createTasksFromLines } from "@/actions/tasks";
import { confirm } from "@/components/ui/confirm-dialog";
import { calendarHref } from "@/lib/calendar";
import {
  formatWeekdayLong,
  parseDateString,
  toDateString,
  startOfDay,
} from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
import { countNoteWords, noteContentToTaskLines } from "@/lib/note-preview";
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
        className="imx-skeleton min-h-[min(70vh,36rem)] rounded-2xl p-4"
        role="status"
        aria-label="Loading editor"
      >
        <div className="imx-skeleton-bone mb-3 h-8 w-48 rounded-md" />
        <div className="imx-skeleton-bone h-64 w-full rounded-lg" />
      </div>
    ),
  },
);

type NoteEditorProps = {
  note: Note;
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function IconAction({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl border border-surface-border bg-surface text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-60",
        destructive &&
          "text-destructive hover:border-destructive/40 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

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
  const journalLabel =
    isJournal && note.journal_date
      ? formatWeekdayLong(parseDateString(note.journal_date))
      : null;

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
      imxToast("Couldn’t save", {
        description: state.error,
        tone: "error",
      });
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
          imxToast("Couldn’t save", {
            description: result.error,
            tone: "error",
          });
          return;
        }
        markSaved(title, content);
        router.refresh();
      });
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [title, content, note.id, router, markSaved]);

  useEffect(() => {
    const dirty =
      status === "dirty" ||
      status === "saving" ||
      title !== baseline.current.title ||
      content !== baseline.current.content;
    if (!dirty) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status, title, content]);

  function handleDelete() {
    void (async () => {
      const ok = await confirm({
        title: `Delete “${note.title.trim() || "Untitled"}”?`,
        description: isJournal
          ? "This removes today’s journal entry."
          : "This removes the note permanently.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      imxToast("Note deleted", { tone: "success" });
      await deleteNote(note.id);
    })();
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/notes/${note.id}`;
    try {
      await navigator.clipboard.writeText(url);
      imxToast("Link copied", { tone: "success" });
    } catch {
      imxToast("Couldn’t copy link", { tone: "error" });
    }
  }

  function spawnTasksFromNote() {
    const lines = noteContentToTaskLines(content);
    if (lines.length === 0) {
      imxToast("Nothing to turn into tasks", {
        description: "Add a few lines or list items first.",
        tone: "error",
      });
      return;
    }
    const due = toDateString(startOfDay(new Date()));
    startManual(async () => {
      const result = await createTasksFromLines(lines, due);
      if (result.error) {
        imxToast("Couldn’t create tasks", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast(
        result.created === 1
          ? "1 task due today"
          : `${result.created} tasks due today`,
        { tone: "success" },
      );
      router.push("/tasks");
    });
  }

  function scheduleNoteOnCalendar() {
    startManual(async () => {
      const result = await createEventFromNote(note.id);
      if (result.error) {
        imxToast("Couldn’t schedule note", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast("Scheduled on calendar", {
        description: title.trim() || "Untitled",
        tone: "success",
      });
      if (result.event_date && result.id) {
        router.push(
          `${calendarHref("week", result.event_date)}#event-${result.id}`,
        );
      }
    });
  }

  const statusLabel =
    status === "saving" || busy
      ? "Saving…"
      : status === "dirty"
        ? "Unsaved"
        : status === "error"
          ? "Couldn’t save"
          : savedAt
            ? `Saved · ${savedAt}`
            : "Saved";

  return (
    <form
      action={formAction}
      className={cn(
        "notes-editor notes-studio relative overflow-hidden rounded-[1.75rem] imx-surface imx-surface-rim",
        isJournal && "notes-editor-journal",
      )}
    >
      <div className="notes-editor-glow" aria-hidden />
      <div className="notes-studio-wash" aria-hidden />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="title" value={title} />

      <div className="relative z-1 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 px-5 py-3.5 sm:px-8 sm:py-4">
        <div className="min-w-0 space-y-1">
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.16em]",
              isJournal
                ? "text-amber-800/75 dark:text-amber-300/85"
                : "text-muted-foreground",
            )}
          >
            {isJournal ? "Journal" : "Note"}
          </p>
          {journalLabel ? (
            <p className="truncate text-sm text-foreground/80">{journalLabel}</p>
          ) : null}
          <p
            className={cn(
              "text-xs",
              status === "error"
                ? "text-destructive"
                : status === "dirty"
                  ? "text-foreground/70"
                  : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {statusLabel}
            <span className="mx-1.5 text-border">·</span>
            <span className="tabular-nums">
              {words} word{words === 1 ? "" : "s"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Save className="size-3.5" />
            {busy ? "Saving…" : "Save"}
          </button>
          <IconAction
            label="Copy link"
            onClick={() => void handleCopyLink()}
          >
            <Link2 className="size-3.5" />
          </IconAction>
          <IconAction
            label="Turn into tasks"
            onClick={spawnTasksFromNote}
            disabled={busy}
          >
            <ListTodo className="size-3.5" />
          </IconAction>
          <IconAction
            label="Schedule on calendar"
            onClick={scheduleNoteOnCalendar}
            disabled={busy}
          >
            <CalendarDays className="size-3.5" />
          </IconAction>
          <IconAction
            label="Delete"
            onClick={handleDelete}
            destructive
          >
            <Trash2 className="size-3.5" />
          </IconAction>
        </div>
      </div>

      <div className="relative z-1 px-5 pt-8 sm:px-10 sm:pt-10">
        <input
          id="note-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled"
          aria-label="Title"
          className="notes-studio-title w-full bg-transparent text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/45 sm:text-4xl sm:leading-[1.15]"
        />
      </div>

      <div className="relative z-1 px-3 pb-6 sm:px-6 sm:pb-8">
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
        <p className="relative z-1 border-t border-border/40 px-5 py-3 text-sm text-destructive sm:px-8">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
