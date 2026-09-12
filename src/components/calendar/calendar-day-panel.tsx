import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
} from "lucide-react";

import { deleteCalendarEvent } from "@/actions/calendar";
import { toggleTaskComplete } from "@/actions/tasks";
import { EventForm } from "@/components/calendar/event-form";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import {
  formatTime,
  formatWeekdayLong,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CalendarDayItems } from "@/types/calendar";

type CalendarDayPanelProps = {
  date: string;
  items: CalendarDayItems;
};

export function CalendarDayPanel({ date, items }: CalendarDayPanelProps) {
  const heading = formatWeekdayLong(parseDateString(date));
  const isToday = date === toDateString(new Date());
  const openTasks = items.tasks.filter((task) => !task.completed).length;
  const total =
    items.events.length + items.tasks.length + items.journals.length;

  return (
    <aside className="cal-dock flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80">
      <div className="border-b border-border/40 px-5 py-4">
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

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
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
                    className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm transition-colors hover:bg-amber-500/15"
                  >
                    <BookOpen className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                    <span className="truncate font-medium">{note.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Events
          </h3>
          {items.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events</p>
          ) : (
            <ul className="space-y-2">
              {items.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
                >
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500/80"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      {event.start_time ? (
                        <>
                          <Clock className="size-3" />
                          {formatTime(event.start_time)}
                        </>
                      ) : (
                        "All day"
                      )}
                    </p>
                    {event.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    ) : null}
                  </div>
                  <form action={deleteCalendarEvent.bind(null, event.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Delete event"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Tasks due
          </h3>
          {items.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due</p>
          ) : (
            <ul className="space-y-2">
              {items.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-1 rounded-xl border border-border/50 bg-background/40 px-2 py-2"
                >
                  <form
                    action={toggleTaskComplete.bind(
                      null,
                      task.id,
                      !task.completed,
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={
                        task.completed ? "Mark incomplete" : "Mark complete"
                      }
                    >
                      {task.completed ? (
                        <CheckCircle2 className="size-4 text-foreground/70" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </form>
                  <div className="min-w-0 flex-1 py-1.5 pr-2">
                    <p
                      className={cn(
                        "text-sm font-medium text-foreground",
                        task.completed &&
                          "text-muted-foreground/70 line-through",
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-auto space-y-5 border-t border-border/40 pt-5">
          <EventForm date={date} />
          <div className="border-t border-border/40 pt-5">
            <TaskForm defaultDueDate={date} compact />
          </div>
        </div>
      </div>
    </aside>
  );
}
