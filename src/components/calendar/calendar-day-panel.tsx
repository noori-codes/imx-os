import Link from "next/link";
import { BookOpen, Calendar, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";

import { deleteCalendarEvent } from "@/actions/calendar";
import { toggleTaskComplete } from "@/actions/tasks";
import { EventForm } from "@/components/calendar/event-form";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatTime, formatWeekdayLong, parseDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CalendarDayItems } from "@/types/calendar";

type CalendarDayPanelProps = {
  date: string;
  items: CalendarDayItems;
};

export function CalendarDayPanel({ date, items }: CalendarDayPanelProps) {
  const heading = formatWeekdayLong(parseDateString(date));
  const hasItems =
    items.events.length > 0 ||
    items.tasks.length > 0 ||
    items.journals.length > 0;

  return (
    <aside className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <Calendar className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <h2 className="text-sm font-semibold leading-snug">{heading}</h2>
          <p className="text-xs text-muted-foreground">
            {hasItems
              ? `${items.events.length} events · ${items.tasks.length} tasks`
              : "Nothing scheduled"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {items.journals.map((note) => (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="flex items-center gap-2 rounded-lg border bg-amber-500/10 px-3 py-2 text-sm hover:bg-amber-500/15"
          >
            <BookOpen className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate font-medium">{note.title}</span>
          </Link>
        ))}

        {items.events.length > 0 ? (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Events
            </h3>
            <ul className="space-y-2">
              {items.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.start_time ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatTime(event.start_time)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        All day
                      </p>
                    )}
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
          </section>
        ) : null}

        {items.tasks.length > 0 ? (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tasks due
            </h3>
            <ul className="space-y-2">
              {items.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2"
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
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.completed &&
                          "text-muted-foreground line-through",
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
          </section>
        ) : null}

        <Separator />
        <EventForm date={date} />
        <Separator />
        <TaskForm defaultDueDate={date} compact />
      </div>
    </aside>
  );
}
