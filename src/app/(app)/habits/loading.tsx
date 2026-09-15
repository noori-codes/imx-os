import { HabitsSkeleton } from "@/components/habits/habits-skeleton";
import { Header } from "@/components/layout/header";

export default function HabitsLoading() {
  return (
    <>
      <Header chrome title="Habits" />
      <HabitsSkeleton />
    </>
  );
}
