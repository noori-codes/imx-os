import { notFound } from "next/navigation";

import { getGoal } from "@/actions/goals";
import { getProject } from "@/actions/projects";
import { getProjectTasks } from "@/actions/tasks";
import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

type ProjectDetailPageProps = {
  params: Promise<{ goalId: string; projectId: string }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { goalId, projectId } = await params;

  const [goal, project, tasks] = await Promise.all([
    getGoal(goalId),
    getProject(goalId, projectId),
    getProjectTasks(projectId),
  ]);

  if (!goal || !project) {
    notFound();
  }

  return (
    <>
      <Header title={project.title} description={`Project under ${goal.title}`} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Breadcrumbs
          items={[
            { label: "Goals", href: "/goals" },
            { label: goal.title, href: `/goals/${goalId}` },
            { label: project.title },
          ]}
        />

        {project.description ? (
          <p className="-mt-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        ) : null}

        <TaskForm projectId={projectId} variant="card" />
        <TaskList tasks={tasks} mode="project" />
      </div>
    </>
  );
}
