import { Suspense } from "react";
import type { Metadata } from "next";

import { getCalendarData } from "@/actions/calendar";
import { CalDayDockScroll } from "@/components/calendar/cal-day-dock-scroll";
import { CalendarDayPanel } from "@/components/calendar/calendar-day-panel";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarKeyboardNav } from "@/components/calendar/calendar-keyboard-nav";
import { CalendarPulse } from "@/components/calendar/calendar-pulse";
import { CalendarSkeleton } from "@/components/calendar/calendar-skeleton";
import { CalendarStage } from "@/components/calendar/calendar-stage";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import {
  getMonthGrid,
  getWeekGrid,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import type { CalendarView } from "@/types/calendar";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Events, tasks, and journals on a schedule",
};

type CalendarPageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
    compose?: string;
  }>;
};

function parseView(value: string | undefined): CalendarView {
  return value === "week" ? "week" : "month";
}

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return toDateString(new Date());
  }
  return value;
}

async function CalendarBody({
  view,
  selectedDate,
  compose,
}: {
  view: CalendarView;
  selectedDate: string;
  compose: boolean;
}) {
  const anchor = parseDateString(selectedDate);
  const days = view === "month" ? getMonthGrid(anchor) : getWeekGrid(anchor);
  const rangeStart = days[0].date;
  const rangeEnd = days[days.length - 1].date;
  const data = await getCalendarData(rangeStart, rangeEnd);
  const selectedItems = data.days[selectedDate] ?? {
    date: selectedDate,
    events: [],
    tasks: [],
    journals: [],
  };
  const inViewDates =
    view === "month"
      ? days.filter((day) => day.inCurrentMonth).map((day) => day.date)
      : days.map((day) => day.date);

  return (
    <AppPageFrame className="max-w-6xl gap-8 md:py-8">
      <CalendarStage>
        <CalendarKeyboardNav view={view} date={selectedDate} />
        <div className="cal-reveal">
          <CalendarPulse
            view={view}
            date={selectedDate}
            data={data}
            inViewDates={inViewDates}
          />
        </div>

        <CalDayDockScroll date={selectedDate} />

        <div className="cal-reveal cal-reveal-delay-1 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)] xl:items-start">
          <div className="min-w-0 space-y-3">
            <CalendarGrid
              view={view}
              selectedDate={selectedDate}
              days={days}
              data={data}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-foreground/55" />
                  Event
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-foreground/35" />
                  Task
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-foreground/70" />
                  Journal
                </span>
              </div>
              <a
                href="#cal-day-dock"
                className="font-medium text-foreground/80 underline-offset-4 hover:underline xl:hidden"
              >
                Day details
              </a>
            </div>
          </div>

          <div
            id="cal-day-dock"
            className="cal-reveal cal-reveal-delay-2 min-h-[28rem] scroll-mt-20 xl:sticky xl:top-4 xl:min-h-[min(70vh,40rem)]"
          >
            <CalendarDayPanel
              date={selectedDate}
              items={selectedItems}
              compose={compose}
            />
          </div>
        </div>
      </CalendarStage>
    </AppPageFrame>
  );
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);
  const selectedDate = parseDateParam(params.date);
  const compose = params.compose === "1";

  return (
    <>
      <Header chrome title="Calendar" />
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarBody
          view={view}
          selectedDate={selectedDate}
          compose={compose}
        />
      </Suspense>
    </>
  );
}
