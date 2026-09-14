import { Header } from "@/components/layout/header";
import { GoalsSkeleton } from "@/components/goals/goals-skeleton";

export default function GoalsLoading() {
  return (
    <>
      <Header title="Goals" />
      <GoalsSkeleton />
    </>
  );
}
