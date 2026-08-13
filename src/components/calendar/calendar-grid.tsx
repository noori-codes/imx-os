import Link from "next/link";

import { calendarHref } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type {
  CalendarData,
  CalendarDayItems,
  CalendarView,
} from "@/types/calendar";
import type { CalendarDay } from "@/lib/date-utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarGridProps = {
  view: CalendarView;
  selectedDate: string;
  days: CalendarDay[];
  data: CalendarData;
};

function chipsFor(items: CalendarDayItems | undefined, limit: number) {
  const empty = {
    visible: [] as { id: string; label: string; kind: "event" | "task" | "journal" }[],
    extra: 0,
    total: 0,
  };

  if (!items) return empty;

  const chips = [
    ...items.events.map((event) => ({
      id: event.id,
      label: event.title,
      kind: "event" as const,
    })),
    ...items.tasks.map((task) => ({
      id: task.id,
      label: task.title,
      kind: "task" as const,
    })),
    ...items.journals.map((note) => ({
      id: note.id,
      label: note.title,
      kind: "journal" as const,
    })),
  ];

  return {
    visible: chips.slice(0, limit),
    extra: Math.max(chips.length - limit, 0),
    total: chips.length,
  };
}

function Chip({
  label,
  kind,
}: {
  label: string;
  kind: "event" | "task" | "journal";
}) {
  return (
    <span
      className={cn(
        "block truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight",
        kind === "event" && "bg-primary/15 text-primary",
        kind === "task" && "bg-muted text-muted-foreground",
        kind === "journal" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {label}
    </span>
  );
}

export function CalendarGrid({
  view,
  selectedDate,
  days,
  data,
}: CalendarGridProps) {
  const chipLimit = view === "week" ? 6 : 3;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "grid grid-cols-7",
          view === "month" ? "auto-rows-fr" : "",
        )}
      >
        {days.map((day) => {
          const items = data.days[day.date];
          const { visible, extra, total } = chipsFor(items, chipLimit);
          const selected = day.date === selectedDate;

          return (
            <Link
              key={day.date}
              href={calendarHref(view, day.date)}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-r border-b p-1.5 transition-colors last:border-r-0 hover:bg-accent/30",
                view === "week" && "min-h-48",
                !day.inCurrentMonth && "bg-muted/20 text-muted-foreground",
                selected && "bg-accent/50",
                day.isToday && !selected && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  day.isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.day}
              </span>

              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {visible.map((chip) => (
                  <Chip key={`${chip.kind}-${chip.id}`} {...chip} />
                ))}
                {extra > 0 ? (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    +{extra} more
                  </span>
                ) : null}
                {view === "week" && total === 0 ? (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    Empty
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
