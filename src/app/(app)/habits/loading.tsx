import { HabitsSkeleton } from "@/components/habits/habits-skeleton";
import { Header } from "@/components/layout/header";

export default function HabitsLoading() {
  return (
    <>
      <Header title="Habits" description="Daily check-ins and streaks" />
      <HabitsSkeleton />
    </>
  );
}
