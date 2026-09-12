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

type Chip = {
  id: string;
  label: string;
  kind: "event" | "task" | "journal";
  meta?: string | null;
};

function dayLoad(items: CalendarDayItems | undefined) {
  if (!items) return 0;
  return items.events.length + items.tasks.length + items.journals.length;
}

function chipsFor(items: CalendarDayItems | undefined): Chip[] {
  if (!items) return [];
  return [
    ...items.events.map((event) => ({
      id: event.id,
      label: event.title,
      kind: "event" as const,
      meta: event.start_time,
    })),
    ...items.tasks.map((task) => ({
      id: task.id,
      label: task.title,
      kind: "task" as const,
      meta: task.completed ? "done" : null,
    })),
    ...items.journals.map((note) => ({
      id: note.id,
      label: note.title,
      kind: "journal" as const,
      meta: null,
    })),
  ];
}

function DensityMarks({ items }: { items: CalendarDayItems | undefined }) {
  if (!items) return null;
  const marks: { key: string; kind: "event" | "task" | "journal" }[] = [];
  for (const event of items.events.slice(0, 3)) {
    marks.push({ key: `e-${event.id}`, kind: "event" });
  }
  for (const task of items.tasks.slice(0, 3)) {
    marks.push({ key: `t-${task.id}`, kind: "task" });
  }
  for (const note of items.journals.slice(0, 2)) {
    marks.push({ key: `j-${note.id}`, kind: "journal" });
  }
  const visible = marks.slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <div className="mt-auto flex flex-wrap items-center justify-center gap-1 px-1 pb-0.5">
      {visible.map((mark) => (
        <span
          key={mark.key}
          className={cn(
            "cal-dot size-1.5 rounded-full",
            mark.kind === "event" && "bg-sky-500/80",
            mark.kind === "task" && "bg-foreground/45",
            mark.kind === "journal" && "bg-amber-500/85",
          )}
        />
      ))}
    </div>
  );
}

function WeekChip({ chip }: { chip: Chip }) {
  return (
    <span
      className={cn(
        "cal-chip block truncate rounded-md px-1.5 py-1 text-left text-[10px] font-medium leading-tight",
        chip.kind === "event" &&
          "bg-sky-500/12 text-sky-800 dark:text-sky-300",
        chip.kind === "task" &&
          (chip.meta === "done"
            ? "bg-muted/70 text-muted-foreground line-through"
            : "bg-muted text-foreground/80"),
        chip.kind === "journal" &&
          "bg-amber-500/12 text-amber-800 dark:text-amber-300",
      )}
    >
      {chip.label}
    </span>
  );
}

export function CalendarGrid({
  view,
  selectedDate,
  days,
  data,
}: CalendarGridProps) {
  const isWeek = view === "week";

  return (
    <div className="cal-grid overflow-hidden rounded-2xl border border-border/50 bg-card/80">
      <div className="grid grid-cols-7 border-b border-border/40">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1.5 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:px-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const items = data.days[day.date];
          const load = dayLoad(items);
          const selected = day.date === selectedDate;
          const allChips = isWeek ? chipsFor(items) : [];
          const chips = allChips.slice(0, 6);
          const extra = Math.max(allChips.length - 6, 0);
          const intensity = Math.min(load, 4);

          return (
            <Link
              key={day.date}
              href={calendarHref(view, day.date)}
              style={{ ["--i" as string]: index }}
              className={cn(
                "cal-cell group relative flex flex-col border-r border-b border-border/35 p-1.5 transition-colors last:border-r-0",
                isWeek ? "min-h-52 sm:min-h-60" : "min-h-[4.75rem] sm:min-h-24",
                !day.inCurrentMonth && "bg-muted/15 text-muted-foreground",
                selected && "cal-cell-selected z-[1]",
                !selected && day.isToday && "bg-muted/40",
                !selected && "hover:bg-muted/30",
              )}
              data-intensity={intensity}
              data-today={day.isToday ? "true" : undefined}
              data-selected={selected ? "true" : undefined}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                    day.isToday &&
                      "bg-foreground text-background",
                    selected &&
                      !day.isToday &&
                      "bg-foreground/10 text-foreground",
                    !day.isToday && !selected && "text-foreground/85",
                    !day.inCurrentMonth && !day.isToday && "text-muted-foreground",
                  )}
                >
                  {day.day}
                </span>
                {!isWeek && load > 0 ? (
                  <span className="pr-0.5 pt-0.5 text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-[[data-selected=true]]:opacity-100">
                    {load}
                  </span>
                ) : null}
              </div>

              {isWeek ? (
                <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                  {chips.map((chip) => (
                    <WeekChip key={`${chip.kind}-${chip.id}`} chip={chip} />
                  ))}
                  {extra > 0 ? (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{extra} more
                    </span>
                  ) : null}
                  {chips.length === 0 ? (
                    <span className="px-1 text-[10px] text-muted-foreground/60">
                      Free
                    </span>
                  ) : null}
                </div>
              ) : (
                <DensityMarks items={items} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
