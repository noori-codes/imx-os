import { getHabitsWithStats } from "@/actions/habits";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { Header } from "@/components/layout/header";

export default async function HabitsPage() {
  const habits = await getHabitsWithStats();

  return (
    <>
      <Header title="Habits" description="Track daily habits and streaks" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <HabitForm />
        <HabitList habits={habits} />
      </div>
    </>
  );
}
