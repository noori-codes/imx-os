import {
  CheckCircle2,
  Flame,
  ListTodo,
  Moon,
  Timer,
  type LucideIcon,
} from "lucide-react";

import type { AnalyticsSummary } from "@/types/analytics";

type AnalyticsSummaryCardsProps = {
  summary: AnalyticsSummary;
  rangeDays: number;
};

export function AnalyticsSummaryCards({
  summary,
  rangeDays,
}: AnalyticsSummaryCardsProps) {
  const cards: {
    label: string;
    value: string | number;
    icon: LucideIcon;
  }[] = [
    {
      label: `Tasks done (${rangeDays}d)`,
      value: summary.tasks_completed,
      icon: ListTodo,
    },
    {
      label: "Focus minutes",
      value: summary.focus_minutes,
      icon: Timer,
    },
    {
      label: "Habit avg rate",
      value: `${summary.habits_avg_rate}%`,
      icon: CheckCircle2,
    },
    {
      label: "Best streak",
      value: summary.best_habit_streak,
      icon: Flame,
    },
    {
      label: "Reviews logged",
      value: summary.reviews_logged,
      icon: Moon,
    },
    {
      label: "Avg mood / energy",
      value:
        summary.avg_mood !== null || summary.avg_energy !== null
          ? `${summary.avg_mood ?? "—"} / ${summary.avg_energy ?? "—"}`
          : "—",
      icon: Moon,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
