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
        description="Goals → Projects → Tasks"
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <GoalForm />
        <GoalList goals={goals} />
      </div>
    </>
  );
}
