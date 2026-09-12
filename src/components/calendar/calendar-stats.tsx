import type { CalendarData } from "@/types/calendar";

type CalendarStatsProps = {
  data: CalendarData;
  inViewDates: string[];
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="cal-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function CalendarStats({ data, inViewDates }: CalendarStatsProps) {
  let events = 0;
  let openTasks = 0;
  let journals = 0;
  let busyDays = 0;

  for (const date of inViewDates) {
    const day = data.days[date];
    if (!day) continue;
    const dayEvents = day.events.length;
    const dayTasks = day.tasks.length;
    const dayJournals = day.journals.length;
    events += dayEvents;
    openTasks += day.tasks.filter((task) => !task.completed).length;
    journals += dayJournals;
    if (dayEvents + dayTasks + dayJournals > 0) busyDays += 1;
  }

  return (
    <div className="cal-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Busy days"
        value={String(busyDays)}
        hint={busyDays === 0 ? "Clear range" : "with something on"}
      />
      <Stat
        label="Events"
        value={String(events)}
        hint={events === 0 ? "None scheduled" : "in this view"}
      />
      <Stat
        label="Open tasks"
        value={String(openTasks)}
        hint={openTasks === 0 ? "Nothing due" : "still open"}
      />
      <Stat
        label="Journals"
        value={String(journals)}
        hint={journals === 0 ? "No entries" : "written days"}
      />
    </div>
  );
}
