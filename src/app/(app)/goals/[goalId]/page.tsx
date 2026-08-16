import { notFound } from "next/navigation";

import { getGoalWithCounts, updateGoal } from "@/actions/goals";
import { getProjectsByGoal } from "@/actions/projects";
import { Header } from "@/components/layout/header";
import { EntityHeader } from "@/components/goals/entity-header";
import { ProjectForm } from "@/components/goals/project-form";
import { ProjectList } from "@/components/goals/project-list";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

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

  const metaParts = [
    `${goal.project_count} project${goal.project_count === 1 ? "" : "s"}`,
  ];
  if (goal.task_count > 0) {
    metaParts.push(
      `${goal.completed_task_count}/${goal.task_count} tasks · ${progress}%`,
    );
  }

  return (
    <>
      <Header title="Goal" description="Projects under this goal" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Breadcrumbs
          items={[
            { label: "Goals", href: "/goals" },
            { label: goal.title },
          ]}
        />

        <EntityHeader
          title={goal.title}
          description={goal.description}
          meta={metaParts.join(" · ")}
          progress={progress}
          onSave={updateGoal.bind(null, goalId)}
        />

        <ProjectForm goalId={goalId} />
        <ProjectList goalId={goalId} projects={projects} />
      </div>
    </>
  );
}
