import {
  getArchivedHabitsWithStats,
  getHabitsWithStats,
} from "@/actions/habits";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { HabitViewTabs } from "@/components/habits/habit-view-tabs";
import { Header } from "@/components/layout/header";
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
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <HabitViewTabs
          active={view}
          activeCount={activeHabits.length}
          archivedCount={archivedHabits.length}
        />
        {view === "active" ? <HabitForm /> : null}
        <HabitList habits={habits} view={view} />
      </div>
    </>
  );
}
