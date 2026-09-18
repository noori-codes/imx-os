import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { calendarHref, findCalendarNextUp } from "@/lib/calendar";
import {
  addDays,
  addMonths,
  formatMonthYear,
  parseDateString,
  startOfMonth,
  toDateString,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CalendarData, CalendarView } from "@/types/calendar";

type CalendarPulseProps = {
  view: CalendarView;
  date: string;
  data: CalendarData;
  inViewDates: string[];
};

export function summarizeCalendarView(
  data: CalendarData,
  inViewDates: string[],
) {
  let events = 0;
  let openTasks = 0;
  let journals = 0;
  let busyDays = 0;

  for (const dayDate of inViewDates) {
    const day = data.days[dayDate];
    if (!day) continue;
    const dayEvents = day.events.length;
    const dayTasks = day.tasks.length;
    const dayJournals = day.journals.length;
    events += dayEvents;
    openTasks += day.tasks.filter((task) => !task.completed).length;
    journals += dayJournals;
    if (dayEvents + dayTasks + dayJournals > 0) busyDays += 1;
  }

  return { events, openTasks, journals, busyDays, totalDays: inViewDates.length };
}

function pulseCopy({
  view,
  busyDays,
  events,
  openTasks,
  journals,
  totalDays,
}: {
  view: CalendarView;
  busyDays: number;
  events: number;
  openTasks: number;
  journals: number;
  totalDays: number;
}) {
  const range = view === "month" ? "this month" : "this week";

  if (busyDays === 0) {
    return {
      title: "Clear horizon",
      body: `Nothing on the grid ${range} yet — pick a day and add an event, task, or journal.`,
      clear: true,
    };
  }

  if (openTasks > 0 && events === 0) {
    return {
      title: openTasks === 1 ? "One due day" : `${openTasks} open due`,
      body: `${busyDays} busy day${busyDays === 1 ? "" : "s"} ${range} — mostly tasks. Seal them or move the dates.`,
      clear: false,
    };
  }

  if (events > 0 && openTasks === 0) {
    return {
      title: events === 1 ? "One event" : `${events} events`,
      body: `${busyDays} of ${totalDays} days lit ${range}${journals > 0 ? ` · ${journals} journal${journals === 1 ? "" : "s"}` : ""}.`,
      clear: false,
    };
  }

  return {
    title: busyDays === 1 ? "One busy day" : `${busyDays} busy days`,
    body: `${events} event${events === 1 ? "" : "s"} · ${openTasks} open task${openTasks === 1 ? "" : "s"}${journals > 0 ? ` · ${journals} journal${journals === 1 ? "" : "s"}` : ""}.`,
    clear: false,
  };
}

export function CalendarPulse({
  view,
  date,
  data,
  inViewDates,
}: CalendarPulseProps) {
  const anchor = parseDateString(date);
  const today = toDateString(new Date());
  const monthAnchor = startOfMonth(anchor);
  const prev = toDateString(
    view === "month" ? addMonths(monthAnchor, -1) : addDays(anchor, -7),
  );
  const next = toDateString(
    view === "month" ? addMonths(monthAnchor, 1) : addDays(anchor, 7),
  );
  const isToday = date === today;
  const summary = summarizeCalendarView(data, inViewDates);
  const copy = pulseCopy({ view, ...summary });
  const nextUp = findCalendarNextUp(data, inViewDates, view, date);
  const progress =
    summary.totalDays > 0
      ? Math.round((summary.busyDays / summary.totalDays) * 100)
      : 0;

  return (
    <section
      className={cn(
        "cal-pulse relative overflow-hidden rounded-[1.75rem] imx-surface px-5 py-6 sm:px-7 sm:py-8",
        copy.clear && "cal-pulse-sealed",
      )}
    >
      <div className="cal-pulse-vignette" aria-hidden />
      <div className="cal-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {view === "month" ? "Month view" : "Week view"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {formatMonthYear(anchor)}
              </h2>
              <div className="flex items-center gap-1">
                <Link
                  href={calendarHref(view, prev)}
                  aria-label="Previous"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-surface-border bg-surface text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <Link
                  href={calendarHref(view, next)}
                  aria-label="Next"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-surface-border bg-surface text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={calendarHref(view, today)}
              className={cn(
                "inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium transition-colors",
                isToday
                  ? "border-foreground/15 bg-foreground text-background"
                  : "border-surface-border bg-surface text-foreground hover:border-border",
              )}
            >
              Today
            </Link>
            <div className="inline-flex rounded-xl border border-surface-border bg-surface p-1">
              {(["month", "week"] as const).map((item) => (
                <Link
                  key={item}
                  href={calendarHref(item, date)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    view === item
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
              {copy.body}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {nextUp ? (
                <Link
                  href={nextUp.href}
                  className="inline-flex h-9 max-w-full items-center gap-2 rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <span className="truncate">
                    Next · {nextUp.title}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 opacity-80" />
                </Link>
              ) : null}
              <Link
                href={calendarHref(view, date, { compose: true })}
                className={cn(
                  "inline-flex h-9 items-center rounded-xl px-3.5 text-sm font-medium transition-colors",
                  nextUp || !copy.clear
                    ? "border border-surface-border bg-surface text-foreground hover:border-border"
                    : "bg-foreground text-background hover:opacity-90",
                )}
              >
                Add event
              </Link>
              {copy.clear ? (
                <Link
                  href="/tasks?compose=1"
                  className="inline-flex h-9 items-center rounded-xl border border-surface-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
                >
                  Add task
                </Link>
              ) : null}
            </div>

            {nextUp ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {nextUp.when}
                {nextUp.kind === "task" ? " · open task" : ""}
              </p>
            ) : null}

            <div className="cal-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Events
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {summary.events > 0 ? summary.events : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Open
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {summary.openTasks > 0 ? summary.openTasks : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Journals
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {summary.journals > 0 ? summary.journals : "—"}
                </p>
              </div>
            </div>
          </div>

          <ProgressRing
            value={progress}
            size={128}
            stroke={7}
            sealed={copy.clear || progress >= 100}
            featured
            className="mx-auto sm:mx-0"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {summary.totalDays === 0
                  ? "—"
                  : `${summary.busyDays}/${summary.totalDays}`}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {copy.clear ? "clear" : "busy"}
              </p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
