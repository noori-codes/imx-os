import { Header } from "@/components/layout/header";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalList } from "@/components/goals/goal-list";
import { getGoals } from "@/actions/goals";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <>
      <Header
        title="Goals"
        description="Outcomes broken into projects and tasks"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <GoalForm />
        <GoalList goals={goals} />
      </div>
    </>
  );
}
