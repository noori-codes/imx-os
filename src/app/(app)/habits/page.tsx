import {
  getArchivedHabitsWithStats,
  getHabitsWithStats,
} from "@/actions/habits";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { HabitViewTabs } from "@/components/habits/habit-view-tabs";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import type { HabitView } from "@/types/habit";

type HabitsPageProps = {
  searchParams: Promise<{ view?: string }>;
};

function parseView(value: string | undefined): HabitView {
  return value === "archived" ? "archived" : "active";
}

export default async function HabitsPage({ searchParams }: HabitsPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);

  const [activeHabits, archivedHabits] = await Promise.all([
    getHabitsWithStats(),
    getArchivedHabitsWithStats(),
  ]);

  const habits = view === "archived" ? archivedHabits : activeHabits;

  return (
    <>
      <Header title="Habits" description="Daily check-ins and streaks" />
      <AppPageFrame>
        <HabitViewTabs
          active={view}
          activeCount={activeHabits.length}
          archivedCount={archivedHabits.length}
        />
        {view === "active" ? <HabitForm /> : null}
        <HabitList habits={habits} view={view} />
      </AppPageFrame>
    </>
  );
}
