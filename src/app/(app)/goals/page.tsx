import { Suspense } from "react";
import type { Metadata } from "next";

import { getGoals } from "@/actions/goals";
import { GoalsBoard } from "@/components/goals/goals-board";
import { GoalsPulse } from "@/components/goals/goals-pulse";
import { GoalsSkeleton } from "@/components/goals/goals-skeleton";
import { GoalsStage } from "@/components/goals/goals-stage";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { goalProgressPercent, pickSpotlightGoal } from "@/lib/goal-status";

export const metadata: Metadata = {
  title: "Goals",
  description: "Goals, projects, and progress",
};

async function GoalsBody({ compose }: { compose: boolean }) {
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
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <GoalsStage>
        <div className="goals-reveal">
          <GoalsPulse
            stats={{
              goalCount: goals.length,
              projectCount,
              completedTasks,
              totalTasks,
              momentum,
              activeCount,
              spotlight: pickSpotlightGoal(goals),
            }}
          />
        </div>

        <div className="goals-reveal goals-reveal-delay-1">
          <GoalsBoard goals={goals} compose={compose} />
        </div>
      </GoalsStage>
    </AppPageFrame>
  );
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string }>;
}) {
  const params = await searchParams;
  const compose = params.compose === "1";

  return (
    <>
      <Header chrome title="Goals" />
      <Suspense fallback={<GoalsSkeleton />}>
        <GoalsBody compose={compose} />
      </Suspense>
    </>
  );
}
