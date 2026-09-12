import { getCalendarData } from "@/actions/calendar";
import { CalendarDayPanel } from "@/components/calendar/calendar-day-panel";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarNav } from "@/components/calendar/calendar-nav";
import { CalendarStage } from "@/components/calendar/calendar-stage";
import { CalendarStats } from "@/components/calendar/calendar-stats";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import {
  getMonthGrid,
  getWeekGrid,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import type { CalendarView } from "@/types/calendar";

type CalendarPageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
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

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);
  const selectedDate = parseDateParam(params.date);
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
    <>
      <Header title="Calendar" />
      <AppPageFrame className="max-w-6xl gap-8 md:py-8">
        <CalendarStage>
          <div className="cal-reveal">
            <CalendarNav view={view} date={selectedDate} />
          </div>

          <div className="cal-reveal cal-reveal-delay-1">
            <CalendarStats data={data} inViewDates={inViewDates} />
          </div>

          <div className="cal-reveal cal-reveal-delay-2 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)] xl:items-start">
            <div className="min-w-0 space-y-3">
              <CalendarGrid
                view={view}
                selectedDate={selectedDate}
                days={days}
                data={data}
              />
              <div className="flex flex-wrap gap-4 px-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-sky-500/80" />
                  Event
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-foreground/45" />
                  Task
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500/85" />
                  Journal
                </span>
              </div>
            </div>

            <div className="min-h-[28rem] xl:sticky xl:top-4 xl:min-h-[min(70vh,40rem)]">
              <CalendarDayPanel date={selectedDate} items={selectedItems} />
            </div>
          </div>
        </CalendarStage>
      </AppPageFrame>
    </>
  );
}
