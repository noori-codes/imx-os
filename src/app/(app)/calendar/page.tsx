import { getCalendarData } from "@/actions/calendar";
import { CalendarDayPanel } from "@/components/calendar/calendar-day-panel";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarNav } from "@/components/calendar/calendar-nav";
import { Header } from "@/components/layout/header";
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

  return (
    <>
      <Header title="Calendar" description="Events, tasks, and journal days" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <CalendarNav view={view} date={selectedDate} />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3 2xl:col-span-4">
            <CalendarGrid
              view={view}
              selectedDate={selectedDate}
              days={days}
              data={data}
            />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-primary/60" />
                Event
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-muted-foreground/40" />
                Task
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-amber-500/70" />
                Journal
              </span>
            </div>
          </div>

          <div className="xl:col-span-2 2xl:col-span-1">
            <CalendarDayPanel date={selectedDate} items={selectedItems} />
          </div>
        </div>
      </div>
    </>
  );
}
