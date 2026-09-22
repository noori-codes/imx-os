"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Calendar,
  CheckSquare,
  ListTodo,
  Loader2,
  Moon,
  NotebookPen,
  Plus,
} from "lucide-react";

import {
  quickCapture,
  type QuickCaptureKind,
} from "@/actions/capture";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IMX_OPEN_CAPTURE_EVENT, openImxCapture } from "@/lib/imx-events";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";

const KINDS: {
  id: QuickCaptureKind;
  label: string;
  hint: string;
  icon: typeof ListTodo;
}[] = [
  {
    id: "task",
    label: "Task",
    hint: "Lands on Today",
    icon: ListTodo,
  },
  {
    id: "note",
    label: "Note",
    hint: "Open right away",
    icon: NotebookPen,
  },
  {
    id: "journal",
    label: "Journal",
    hint: "Today’s page",
    icon: Moon,
  },
  {
    id: "habit",
    label: "Habit",
    hint: "New streak track",
    icon: CheckSquare,
  },
  {
    id: "event",
    label: "Event",
    hint: "All-day today",
    icon: Calendar,
  },
];

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function hasOpenModal() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], [data-slot="dialog-content"][data-state="open"]',
    ),
  );
}

export function QuickCapture({
  initialOpen = false,
}: {
  initialOpen?: boolean;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(initialOpen);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<QuickCaptureKind>("task");
  const [pending, startTransition] = useTransition();
  const isRunning = useFocusTimer((s) => s.isRunning);

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(IMX_OPEN_CAPTURE_EVENT, onOpen);
    return () => window.removeEventListener(IMX_OPEN_CAPTURE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "c" && event.key !== "C") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (hasOpenModal()) return;
      if (isRunning) return;

      event.preventDefault();
      setOpen(true);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(t);
  }, [open]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setText("");
      setKind("task");
    }
  }

  function submit() {
    const value = text.trim();
    if (!value || pending) return;

    startTransition(async () => {
      const result = await quickCapture(kind, value);
      if (result.error) {
        imxToast(result.error, { tone: "error" });
        return;
      }

      imxToast(result.title ?? "Captured", {
        tone: "success",
        actionHref: result.href,
        actionLabel: result.openLabel,
      });

      if (
        result.href &&
        (kind === "note" || kind === "journal" || kind === "task")
      ) {
        const { writeContinuePointer } = await import("@/lib/imx-continue");
        writeContinuePointer({
          kind: kind === "task" ? "task" : "note",
          label: value.trim().split("\n")[0]?.trim() || "Captured",
          href: result.href,
        });
      }

      handleOpenChange(false);
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const active = KINDS.find((item) => item.id === kind) ?? KINDS[0];

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="imx-surface-float gap-0 overflow-hidden border-surface-border p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/40 px-5 pb-4 pt-5 pr-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Quick capture
            </p>
            <DialogTitle id={titleId} className="mt-1.5 text-lg">
              What’s on your mind?
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {active.hint}. Enter saves · Shift+Enter for a new line.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="px-5 py-4">
            <div
              role="radiogroup"
              aria-label="Capture type"
              className="flex flex-wrap gap-1.5"
            >
              {KINDS.map((item) => {
                const Icon = item.icon;
                const selected = item.id === kind;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={pending}
                    onClick={() => setKind(item.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-foreground/30 bg-foreground text-background dark:border-foreground/25 dark:bg-foreground/12 dark:text-foreground"
                        : "border-surface-border bg-surface text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5 opacity-80" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <textarea
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onInputKeyDown}
              rows={3}
              disabled={pending}
              placeholder={
                kind === "task"
                  ? "Ship the landing polish…"
                  : kind === "habit"
                    ? "Morning stretch"
                    : kind === "event"
                      ? "Coffee with Sam"
                      : kind === "journal"
                        ? "Today felt…"
                        : "A thought worth keeping…"
              }
              className="mt-3 w-full resize-none rounded-2xl border border-surface-border bg-surface px-3.5 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={titleId}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[11px] tabular-nums text-muted-foreground">
                <kbd className="rounded-md border border-border/70 bg-muted/70 px-1.5 py-0.5 font-mono text-[10px]">
                  C
                </kbd>
                <span className="ml-1.5">anywhere</span>
              </p>
              <Button
                type="submit"
                disabled={pending || !text.trim()}
                className="min-w-24 rounded-xl"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Capture"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {!isRunning ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-start p-4 md:hidden"
          style={{ bottom: "var(--mobile-chrome-bottom)" }}
        >
          <button
            type="button"
            onClick={() => openImxCapture()}
            className="pointer-events-auto inline-flex size-12 items-center justify-center rounded-2xl border border-surface-border bg-foreground text-background shadow-lg transition-opacity hover:opacity-90"
            aria-label="Quick capture"
          >
            <Plus className="size-5" strokeWidth={2.25} />
          </button>
        </div>
      ) : null}
    </>
  );
}
