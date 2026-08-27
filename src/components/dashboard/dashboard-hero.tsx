import Link from "next/link";
import { Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardHeroProps = {
  name: string;
  greeting: string;
  intent: string | null;
  dueToday: number;
  overdue: number;
  focusMinutes: number;
  habitsDone: number;
  habitsTotal: number;
  streak: number;
};

function buildStory({
  intent,
  dueToday,
  overdue,
  focusMinutes,
  habitsDone,
  habitsTotal,
}: Pick<
  DashboardHeroProps,
  | "intent"
  | "dueToday"
  | "overdue"
  | "focusMinutes"
  | "habitsDone"
  | "habitsTotal"
>) {
  if (intent?.trim()) return intent.trim();

  const attention = dueToday + overdue;
  const habitsLabel =
    habitsTotal > 0 ? `${habitsDone}/${habitsTotal} habits` : null;
  const focusLabel =
    focusMinutes > 0 ? `${formatFocusMinutes(focusMinutes)} focus` : null;

  if (attention > 0) {
    const due =
      overdue > 0 && dueToday > 0
        ? `${dueToday} due · ${overdue} overdue`
        : overdue > 0
          ? `${overdue} overdue`
          : `${dueToday} due today`;
    const extras = [focusLabel, habitsLabel].filter(Boolean);
    return extras.length > 0 ? `${due} · ${extras.join(" · ")}` : due;
  }

  if (focusLabel || habitsLabel) {
    return ["Clear on tasks", focusLabel, habitsLabel]
      .filter(Boolean)
      .join(" · ");
  }

  return "You're clear — nice work.";
}

export function DashboardHero({
  name,
  greeting,
  intent,
  dueToday,
  overdue,
  focusMinutes,
  habitsDone,
  habitsTotal,
  streak,
}: DashboardHeroProps) {
  const story = buildStory({
    intent,
    dueToday,
    overdue,
    focusMinutes,
    habitsDone,
    habitsTotal,
  });
  const attention = dueToday + overdue;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Today
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {greeting}, {name}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-snug text-muted-foreground sm:text-base">
            {story}
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <Link
            href="/focus"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Timer className="size-3.5" />
            Focus
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Due
          </p>
          <p
            className={cn(
              "mt-1.5 text-2xl font-medium tracking-tight tabular-nums sm:text-3xl",
              attention > 0 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {attention > 0 ? attention : "0"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {overdue > 0
              ? `${dueToday} today · ${overdue} overdue`
              : dueToday > 0
                ? "today"
                : "clear"}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Focus
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {formatFocusMinutes(focusMinutes)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">sealed today</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Habits
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {habitsTotal > 0 ? "checked in" : "none yet"}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Streak
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {streak}d
          </p>
          <p className="mt-1 text-xs text-muted-foreground">activity</p>
        </div>
      </div>
    </div>
  );
}
