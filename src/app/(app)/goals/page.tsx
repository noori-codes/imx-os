import { getGoals } from "@/actions/goals";
import { GoalsBoard } from "@/components/goals/goals-board";
import { GoalsStage } from "@/components/goals/goals-stage";
import { GoalsStats } from "@/components/goals/goals-stats";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { goalProgressPercent } from "@/lib/goal-status";

export default async function GoalsPage() {
  const goals = await getGoals();

  const projectCount = goals.reduce((sum, goal) => sum + goal.project_count, 0);
  const totalTasks = goals.reduce((sum, goal) => sum + goal.task_count, 0);
  const completedTasks = goals.reduce(
    (sum, goal) => sum + goal.completed_task_count,
    0,
  );
  const momentum =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

  const activeCount = goals.filter(
    (goal) => goal.task_count > 0 && goalProgressPercent(goal) < 100,
  ).length;

  return (
    <>
      <Header title="Goals" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <GoalsStage>
          <div className="goals-reveal">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">North star board</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Goals
                </h2>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Outcomes broken into projects and tasks
                  {activeCount > 0 ? ` · ${activeCount} in flight` : ""}.
                </p>
              </div>
            </header>
          </div>

          <div className="goals-reveal goals-reveal-delay-1">
            <GoalsStats
              goalCount={goals.length}
              projectCount={projectCount}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              momentum={momentum}
            />
          </div>

          <div className="goals-reveal goals-reveal-delay-2">
            <GoalsBoard goals={goals} />
          </div>
        </GoalsStage>
      </AppPageFrame>
    </>
  );
}
