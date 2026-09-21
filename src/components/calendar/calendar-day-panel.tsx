"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Copy,
  ListTodo,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";

import {
  deleteCalendarEvent,
  duplicateCalendarEvent,
  createCalendarEvent,
} from "@/actions/calendar";
import { createJournalNoteAction } from "@/actions/notes";
import { toggleTaskComplete, updateTask } from "@/actions/tasks";
import { EventForm } from "@/components/calendar/event-form";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import {
  calendarHref,
  compareEventsByTime,
  formatEventWhen,
} from "@/lib/calendar";
import {
  defaultFocusBlockTimes,
  encodeFocusBlock,
  focusHrefFromBlock,
} from "@/lib/focus-calendar-block";
import {
  addDays,
  formatWeekdayLong,
  parseDateString,
  startOfDay,
  toDateString,
} from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";
import type { CalendarDayItems, CalendarEvent, CalendarTask } from "@/types/calendar";

type CalendarDayPanelProps = {
  date: string;
  items: CalendarDayItems;
  compose?: boolean;
};

function focusDayField(selector: string) {
  const root = document.getElementById("cal-day-forms");
  root?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  root?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
}

function DayTaskToggle({
  taskId,
  completed,
}: {
  taskId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      disabled={pending}
      aria-label={completed ? "Mark incomplete" : "Mark complete"}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleTaskComplete(taskId, !completed);
          if (result.error) {
            imxToast("Couldn’t update task", {
              description: result.error,
              tone: "error",
            });
          }
        });
      }}
    >
      {completed ? (
        <CheckCircle2 className="size-4 text-foreground/70" />
      ) : (
        <Circle className="size-4 text-muted-foreground" />
      )}
    </Button>
  );
}

function DayTaskDueChips({
  task,
  onScheduleFocusBlock,
}: {
  task: CalendarTask;
  onScheduleFocusBlock?: (taskId: string) => void;
}) {
  const [, startTransition] = useTransition();
  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));
  const deferBase = task.due_date
    ? parseDateString(task.due_date)
    : startOfDay(new Date());
  const plusOne = toDateString(addDays(deferBase, 1));
  const nextWeek = toDateString(addDays(deferBase, 7));

  function schedule(nextDue: string | null) {
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title: task.title,
        due_date: nextDue,
        recurrence: task.recurrence,
      });
      if (result.error) {
        imxToast("Couldn’t update due date", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast(
        nextDue === null
          ? "Cleared due date"
          : nextDue === today
            ? "Due today"
            : nextDue === tomorrow
              ? "Due tomorrow"
              : "Due date updated",
        { tone: "success" },
      );
    });
  }

  if (task.completed) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {(
        [
          { label: "Today", value: today },
          { label: "Tmrw", value: tomorrow },
          { label: "+1d", value: plusOne },
          { label: "+1w", value: nextWeek },
        ] as const
      ).map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => schedule(chip.value)}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
            task.due_date === chip.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {chip.label}
        </button>
      ))}
      <Link
        href={`/focus?task=${task.id}`}
        className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Focus on this task"
      >
        <Timer className="size-3" />
        Focus
      </Link>
      {onScheduleFocusBlock ? (
        <button
          type="button"
          onClick={() => onScheduleFocusBlock(task.id)}
          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Block
        </button>
      ) : null}
    </div>
  );
}

function EventRow({
  event,
  editing,
  highlighted,
  onEdit,
}: {
  event: CalendarEvent;
  editing: boolean;
  highlighted: boolean;
  onEdit: () => void;
}) {
  const focusHref = focusHrefFromBlock(event.description);
  const isFocusBlock = Boolean(focusHref);
  const displayDescription =
    isFocusBlock || !event.description
      ? null
      : event.description
          .split("\n")
          .filter((line) => !line.trim().startsWith("imx:focus"))
          .join("\n")
          .trim() || null;

  return (
    <li
      id={`event-${event.id}`}
      className={cn(
        "cal-timeline-row scroll-mt-24 grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2",
        highlighted && "cal-timeline-flash",
      )}
    >
      <div className="pt-2.5 text-right">
        <p className="text-[10px] font-medium leading-tight tabular-nums text-muted-foreground">
          {event.start_time ? formatEventWhen(event).split(" – ")[0] : "All day"}
        </p>
        {event.start_time && event.end_time ? (
          <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/70">
            {formatEventWhen(event).split(" – ")[1]}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          "relative flex items-start gap-2 rounded-xl imx-surface imx-surface-rim px-3 py-2.5 transition-shadow",
          editing
            ? "border-foreground/35 ring-1 ring-foreground/15"
            : highlighted
              ? "border-foreground/30 ring-1 ring-foreground/20"
              : isFocusBlock
                ? "border-foreground/25"
                : "border-border/50",
        )}
      >
        <span
          className={cn(
            "absolute top-3 -left-[1.05rem] size-2 rounded-full ring-2 ring-card",
            isFocusBlock ? "bg-foreground/70" : "bg-foreground/45",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {focusHref ? (
            <Link
              href={focusHref}
              className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
            >
              {event.title}
            </Link>
          ) : (
            <p className="text-sm font-medium text-foreground">{event.title}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isFocusBlock ? "Focus block · " : ""}
            {formatEventWhen(event)}
          </p>
          {displayDescription ? (
            <p className="mt-1 text-xs text-muted-foreground">{displayDescription}</p>
          ) : null}
          {focusHref ? (
            <Link
              href={focusHref}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <Timer className="size-3" />
              Open Focus
            </Link>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          aria-label={`Edit ${event.title}`}
          aria-pressed={editing}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
        </Button>
        <EventDuplicateButton event={event} />
        <EventDeleteButton eventId={event.id} title={event.title} />
      </div>
    </li>
  );
}

function TaskRow({
  task,
  onScheduleFocusBlock,
}: {
  task: CalendarTask;
  onScheduleFocusBlock?: (taskId: string) => void;
}) {
  return (
    <li className="cal-timeline-row grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2">
      <div className="pt-3 text-right">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Due
        </p>
      </div>
      <div className="relative flex items-start gap-1 rounded-xl imx-surface imx-surface-rim px-2 py-2">
        <span
          className="absolute top-3.5 -left-[1.05rem] size-2 rounded-full bg-foreground/45 ring-2 ring-card"
          aria-hidden
        />
        <DayTaskToggle taskId={task.id} completed={task.completed} />
        <div className="min-w-0 flex-1 py-1.5 pr-2">
          <p
            className={cn(
              "text-sm font-medium text-foreground",
              task.completed && "text-muted-foreground/70 line-through",
            )}
          >
            {task.title}
          </p>
          {task.context && task.context_href ? (
            <Link
              href={task.context_href}
              className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline"
            >
              {task.context}
            </Link>
          ) : (
            <Link
              href="/tasks"
              className="mt-0.5 block text-xs text-muted-foreground hover:underline"
            >
              Standalone task
            </Link>
          )}
          <DayTaskDueChips
            task={task}
            onScheduleFocusBlock={onScheduleFocusBlock}
          />
        </div>
      </div>
    </li>
  );
}

export function CalendarDayPanel({
  date,
  items,
  compose = false,
}: CalendarDayPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const heading = formatWeekdayLong(parseDateString(date));
  const isToday = date === toDateString(new Date());
  const openTasks = items.tasks.filter((task) => !task.completed).length;
  const total =
    items.events.length + items.tasks.length + items.journals.length;
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [highlightEventId, setHighlightEventId] = useState<string | null>(null);
  const [focusComposer, setFocusComposer] = useState(compose);
  const [focusBlockPending, startFocusBlock] = useTransition();

  function createFocusBlock(taskId?: string | null) {
    startFocusBlock(async () => {
      const times = defaultFocusBlockTimes(25);
      const fd = new FormData();
      fd.set("title", "Focus block");
      fd.set("description", encodeFocusBlock(taskId));
      fd.set("event_date", date);
      fd.set("start_time", times.start);
      fd.set("end_time", times.end);
      const result = await createCalendarEvent(null, fd);
      if (result.error) {
        imxToast("Couldn’t add Focus block", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast("Focus block scheduled", {
        description: `${times.start}–${times.end} · open from the agenda`,
        tone: "success",
      });
    });
  }

  const sortedEvents = useMemo(
    () => [...items.events].sort(compareEventsByTime),
    [items.events],
  );
  const openTaskList = useMemo(
    () => items.tasks.filter((task) => !task.completed),
    [items.tasks],
  );
  const doneTaskList = useMemo(
    () => items.tasks.filter((task) => task.completed),
    [items.tasks],
  );

  useEffect(() => {
    setEditingEvent(null);
  }, [date]);

  useEffect(() => {
    if (!compose) return;
    setFocusComposer(true);
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    params.delete("compose");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [compose, pathname, router]);

  useEffect(() => {
    if (!focusComposer) return;
    window.requestAnimationFrame(() => {
      document
        .getElementById("cal-day-forms")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      document.getElementById("event-title")?.focus({ preventScroll: true });
    });
  }, [focusComposer, date]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.startsWith("event-")) return;
    const eventId = hash.slice("event-".length);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setHighlightEventId(eventId);
    });
    const timer = window.setTimeout(() => setHighlightEventId(null), 2200);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [date, items.events]);

  return (
    <aside className="cal-dock relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.35rem] imx-surface imx-surface-rim">
      <div className="cal-dock-glow" aria-hidden />
      <div className="relative z-1 border-b border-border/40 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {isToday ? "Today" : "Selected day"}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          {heading}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {total === 0
            ? "Nothing scheduled"
            : `${items.events.length} event${items.events.length === 1 ? "" : "s"} · ${openTasks} open task${openTasks === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="relative z-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        {total === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={isToday ? "Today is open" : "Quiet day"}
            description="Add an event, schedule a task, or leave a journal line."
            variant="plain"
            className="py-8"
          >
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => focusDayField("#event-title")}
              >
                <Plus className="size-3.5" />
                Event
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={focusBlockPending}
                onClick={() => createFocusBlock()}
              >
                <Timer className="size-3.5" />
                Focus block
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => focusDayField("#cal-task-title")}
              >
                <ListTodo className="size-3.5" />
                Task
              </Button>
              <form action={createJournalNoteAction}>
                <input type="hidden" name="journal_date" value={date} />
                <Button type="submit" size="sm" variant="outline">
                  <BookOpen className="size-3.5" />
                  Journal
                </Button>
              </form>
            </div>
          </EmptyState>
        ) : (
          <>
            {items.journals.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Journal
                </h3>
                <ul className="space-y-2">
                  {items.journals.map((note) => (
                    <li key={note.id}>
                      <Link
                        href={`/notes/${note.id}`}
                        className="flex items-center gap-2.5 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm transition-colors hover:bg-foreground/8"
                      >
                        <BookOpen className="size-4 shrink-0 text-foreground/70" />
                        <span className="truncate font-medium">{note.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="space-y-2">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Journal
                </h3>
                <form action={createJournalNoteAction}>
                  <input type="hidden" name="journal_date" value={date} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="w-full justify-start rounded-xl border-dashed"
                  >
                    <BookOpen className="size-3.5" />
                    Write journal for this day
                  </Button>
                </form>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Day agenda
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={focusBlockPending}
                    onClick={() => createFocusBlock()}
                    className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                  >
                    Focus block
                  </button>
                  <button
                    type="button"
                    onClick={() => focusDayField("#event-title")}
                    className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Add event
                  </button>
                </div>
              </div>

              {sortedEvents.length === 0 && openTaskList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open items —{" "}
                  <button
                    type="button"
                    onClick={() => focusDayField("#event-title")}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    schedule something
                  </button>
                </p>
              ) : (
                <ol className="cal-timeline relative space-y-2.5 before:absolute before:top-2 before:bottom-2 before:left-[3.25rem] before:w-px before:bg-border/50">
                  {sortedEvents.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      editing={editingEvent?.id === event.id}
                      highlighted={highlightEventId === event.id}
                      onEdit={() => {
                        setEditingEvent(event);
                        window.requestAnimationFrame(() => {
                          document
                            .getElementById("cal-day-forms")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            });
                          document
                            .getElementById("event-title")
                            ?.focus({ preventScroll: true });
                        });
                      }}
                    />
                  ))}
                  {openTaskList.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onScheduleFocusBlock={createFocusBlock}
                    />
                  ))}
                </ol>
              )}

              {doneTaskList.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Done
                  </h4>
                  <ul className="space-y-2">
                    {doneTaskList.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onScheduleFocusBlock={createFocusBlock}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}

              {openTaskList.length === 0 && sortedEvents.length > 0 ? (
                <button
                  type="button"
                  onClick={() => focusDayField("#cal-task-title")}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Nothing due — capture a task
                </button>
              ) : null}
            </section>
          </>
        )}

        <div
          id="cal-day-forms"
          className="cal-composer relative mt-auto space-y-5 overflow-hidden rounded-2xl imx-surface imx-surface-rim p-4"
        >
          <div className="cal-composer-glow" aria-hidden />
          <div className="relative z-1 space-y-5">
            <EventForm
              key={editingEvent?.id ?? "new"}
              date={date}
              event={editingEvent ?? undefined}
              onCancel={() => setEditingEvent(null)}
              onSaved={() => setEditingEvent(null)}
              autoFocus={focusComposer && !editingEvent}
            />
            <div className="border-t border-border/40 pt-5">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Task due this day
              </p>
              <TaskForm
                defaultDueDate={date}
                compact
                titleInputId="cal-task-title"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function EventDuplicateButton({ event }: { event: CalendarEvent }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground"
      aria-label={`Duplicate ${event.title} to tomorrow`}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicateCalendarEvent(event.id);
          if (result.error) {
            imxToast("Couldn’t duplicate event", {
              description: result.error,
              tone: "error",
            });
            return;
          }
          imxToast("Event copied to next day", {
            description: event.title,
            tone: "success",
          });
          if (result.event_date && result.id) {
            const params = new URLSearchParams(window.location.search);
            const view = params.get("view") === "week" ? "week" : "month";
            router.push(
              `${calendarHref(view, result.event_date)}#event-${result.id}`,
            );
          }
        });
      }}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}

function EventDeleteButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  const [, startTransition] = useTransition();

  function handleDelete() {
    void (async () => {
      const ok = await confirm({
        title: `Delete “${title}”?`,
        description: "This removes the event from your calendar.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      startTransition(async () => {
        const result = await deleteCalendarEvent(eventId);
        if (result?.error) {
          imxToast("Couldn’t delete event", {
            description: result.error,
            tone: "error",
          });
          return;
        }
        imxToast("Event deleted", { tone: "success" });
      });
    })();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
      aria-label="Delete event"
      onClick={handleDelete}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
