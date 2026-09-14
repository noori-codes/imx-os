import { notFound } from "next/navigation";

import { getGoalWithCounts, updateGoal } from "@/actions/goals";
import { getProjectsByGoal } from "@/actions/projects";
import { EntityHeader } from "@/components/goals/entity-header";
import { GoalsStage } from "@/components/goals/goals-stage";
import { ProjectForm } from "@/components/goals/project-form";
import { ProjectList } from "@/components/goals/project-list";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { goalMotion, goalMotionLabel } from "@/lib/goal-status";

type GoalDetailPageProps = {
  params: Promise<{ goalId: string }>;
};

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { goalId } = await params;
  const [goal, projects] = await Promise.all([
    getGoalWithCounts(goalId),
    getProjectsByGoal(goalId),
  ]);

  if (!goal) {
    notFound();
  }

  const progress =
    goal.task_count > 0
      ? Math.round((goal.completed_task_count / goal.task_count) * 100)
      : null;

  const motion = goalMotion(goal);
  const metaParts = [
    goalMotionLabel(motion),
    `${goal.project_count} project${goal.project_count === 1 ? "" : "s"}`,
  ];
  if (goal.task_count > 0) {
    metaParts.push(
      `${goal.completed_task_count}/${goal.task_count} tasks · ${progress}%`,
    );
  }

  return (
    <>
      <Header title="Goal" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <GoalsStage>
          <div className="goals-reveal">
            <Breadcrumbs
              items={[
                { label: "Goals", href: "/goals" },
                { label: goal.title },
              ]}
            />
          </div>

          <div className="goals-reveal goals-reveal-delay-1">
            <EntityHeader
              title={goal.title}
              description={goal.description}
              meta={metaParts.join(" · ")}
              progress={progress}
              onSave={updateGoal.bind(null, goalId)}
            />
          </div>

          <div className="goals-reveal goals-reveal-delay-2 space-y-5">
            <div className="goals-composer rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Projects
              </p>
              <ProjectForm goalId={goalId} variant="composer" />
            </div>
            <ProjectList goalId={goalId} projects={projects} />
          </div>
        </GoalsStage>
      </AppPageFrame>
    </>
  );
}
