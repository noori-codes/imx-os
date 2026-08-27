import type { TaskView } from "@/types/task";

type TasksHeroProps = {
  view: TaskView;
  openCount: number;
  nextDueLabel?: string | null;
};

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function heroCopy({
  view,
  openCount,
  nextDueLabel,
}: TasksHeroProps): { eyebrow: string; title: string; detail: string } {
  switch (view) {
    case "today":
      return {
        eyebrow: "Today",
        title: formatTodayLabel(),
        detail:
          openCount === 0
            ? "Clear — nothing due"
            : openCount === 1
              ? "1 open"
              : `${openCount} open`,
      };
    case "inbox":
      return {
        eyebrow: "Inbox",
        title: "Capture",
        detail:
          openCount === 0
            ? "Empty — ready for anything"
            : openCount === 1
              ? "1 unfiled"
              : `${openCount} unfiled`,
      };
    case "upcoming":
      return {
        eyebrow: "Upcoming",
        title: "Ahead",
        detail:
          openCount === 0
            ? "No future dates yet"
            : nextDueLabel
              ? `Next · ${nextDueLabel}`
              : openCount === 1
                ? "1 scheduled"
                : `${openCount} scheduled`,
      };
    case "all":
      return {
        eyebrow: "All",
        title: "Everything",
        detail:
          openCount === 0
            ? "No open tasks"
            : openCount === 1
              ? "1 open"
              : `${openCount} open`,
      };
  }
}

export function TasksHero({
  view,
  openCount,
  nextDueLabel = null,
}: TasksHeroProps) {
  const copy = heroCopy({ view, openCount, nextDueLabel });

  return (
    <div className="min-w-0 text-center sm:text-left">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {copy.eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.detail}</p>
    </div>
  );
}
