import { Suspense } from "react";
import type { Metadata } from "next";

import {
  countHabits,
  getArchivedHabitsWithStats,
  getHabitsWithStats,
} from "@/actions/habits";
import { HabitsBoard } from "@/components/habits/habits-board";
import { HabitsSkeleton } from "@/components/habits/habits-skeleton";
import { HabitsStage } from "@/components/habits/habits-stage";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import type { HabitView, HabitWithStats } from "@/types/habit";

export const metadata: Metadata = {
  title: "Habits",
  description: "Daily check-ins and streaks",
};

type HabitsPageProps = {
  searchParams: Promise<{ view?: string; compose?: string }>;
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

async function HabitsBody({
  view,
  compose,
}: {
  view: HabitView;
  compose: boolean;
}) {
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
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <HabitsStage>
        <div className="habits-reveal">
          <HabitsBoard
            habits={habits}
            view={view}
            activeCount={activeCount}
            archivedCount={archivedCount}
            compose={compose}
            pulseStats={{
              doneToday,
              activeCount: statsHabits.length,
              bestStreak,
              weekRate,
            }}
          />
        </div>
      </HabitsStage>
    </AppPageFrame>
  );
}

export default async function HabitsPage({ searchParams }: HabitsPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);
  const compose = params.compose === "1";

  return (
    <>
      <Header chrome title="Habits" />
      <Suspense fallback={<HabitsSkeleton />}>
        <HabitsBody view={view} compose={compose} />
      </Suspense>
    </>
  );
}
