import {
  countHabits,
  getArchivedHabitsWithStats,
  getHabitsWithStats,
} from "@/actions/habits";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { HabitViewTabs } from "@/components/habits/habit-view-tabs";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import type { HabitView, HabitWithStats } from "@/types/habit";

type HabitsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

function parseView(value: string | undefined): HabitView {
  return value === "archived" ? "archived" : "active";
}

export default async function HabitsPage({ searchParams }: HabitsPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);

  let habits: HabitWithStats[];
  let activeCount: number;
  let archivedCount: number;

  if (view === "archived") {
    const [archivedHabits, active] = await Promise.all([
      getArchivedHabitsWithStats(),
      countHabits(false),
    ]);
    habits = archivedHabits;
    activeCount = active;
    archivedCount = archivedHabits.length;
  } else {
    const [activeHabits, archived] = await Promise.all([
      getHabitsWithStats(),
      countHabits(true),
    ]);
    habits = activeHabits;
    activeCount = activeHabits.length;
    archivedCount = archived;
  }

  return (
    <>
      <Header title="Habits" description="Daily check-ins and streaks" />
      <AppPageFrame>
        <HabitViewTabs
          active={view}
          activeCount={activeCount}
          archivedCount={archivedCount}
        />
        {view === "active" ? <HabitForm /> : null}
        <HabitList habits={habits} view={view} />
      </AppPageFrame>
    </>
  );
}
