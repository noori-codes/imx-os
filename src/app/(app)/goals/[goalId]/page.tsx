import { notFound } from "next/navigation";

import { getGoal } from "@/actions/goals";
import { getProjectsByGoal } from "@/actions/projects";
import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/goals/project-form";
import { ProjectList } from "@/components/goals/project-list";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

type GoalDetailPageProps = {
  params: Promise<{ goalId: string }>;
};

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { goalId } = await params;
  const goal = await getGoal(goalId);

  if (!goal) {
    notFound();
  }

  const projects = await getProjectsByGoal(goalId);

  return (
    <>
      <Header title={goal.title} description="Projects under this goal" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Breadcrumbs
          items={[
            { label: "Goals", href: "/goals" },
            { label: goal.title },
          ]}
        />

        {goal.description ? (
          <p className="-mt-2 text-sm text-muted-foreground">
            {goal.description}
          </p>
        ) : null}

        <ProjectForm goalId={goalId} />
        <ProjectList goalId={goalId} projects={projects} />
      </div>
    </>
  );
}
