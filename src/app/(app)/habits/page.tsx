import {
  countHabits,
  getArchivedHabitsWithStats,
  getHabitsWithStats,
} from "@/actions/habits";
import { HabitsBoard } from "@/components/habits/habits-board";
import { HabitsStage } from "@/components/habits/habits-stage";
import { HabitsStats } from "@/components/habits/habits-stats";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import type { HabitView, HabitWithStats } from "@/types/habit";

type HabitsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

function parseView(value: string | undefined): HabitView {
  return value === "archived" ? "archived" : "active";
}

function weekHitRate(habits: HabitWithStats[]): number | null {
  if (habits.length === 0) return null;
  let hits = 0;
  let slots = 0;
  for (const habit of habits) {
    for (const day of habit.week) {
      slots += 1;
      if (day.completed) hits += 1;
    }
  }
  if (slots === 0) return null;
  return Math.round((hits / slots) * 100);
}

export default async function HabitsPage({ searchParams }: HabitsPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);

  let habits: HabitWithStats[];
  let activeCount: number;
  let archivedCount: number;
  let statsHabits: HabitWithStats[];

  if (view === "archived") {
    const [archivedHabits, active, activeForStats] = await Promise.all([
      getArchivedHabitsWithStats(),
      countHabits(false),
      getHabitsWithStats(),
    ]);
    habits = archivedHabits;
    activeCount = active;
    archivedCount = archivedHabits.length;
    statsHabits = activeForStats;
  } else {
    const [activeHabits, archived] = await Promise.all([
      getHabitsWithStats(),
      countHabits(true),
    ]);
    habits = activeHabits;
    activeCount = activeHabits.length;
    archivedCount = archived;
    statsHabits = activeHabits;
  }

  const doneToday = statsHabits.filter((h) => h.completed_today).length;
  const bestStreak = statsHabits.reduce(
    (best, habit) => Math.max(best, habit.longest_streak, habit.current_streak),
    0,
  );
  const weekRate = weekHitRate(statsHabits);

  return (
    <>
      <Header title="Habits" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <HabitsStage>
          <div className="habits-reveal">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Daily pulse</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Habits
                </h2>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Check in once a day. Watch the week light up.
                </p>
              </div>
            </header>
          </div>

          <div className="habits-reveal habits-reveal-delay-1">
            <HabitsStats
              doneToday={doneToday}
              activeCount={statsHabits.length}
              bestStreak={bestStreak}
              weekRate={weekRate}
            />
          </div>

          <div className="habits-reveal habits-reveal-delay-2">
            <HabitsBoard
              habits={habits}
              view={view}
              activeCount={activeCount}
              archivedCount={archivedCount}
            />
          </div>
        </HabitsStage>
      </AppPageFrame>
    </>
  );
}
