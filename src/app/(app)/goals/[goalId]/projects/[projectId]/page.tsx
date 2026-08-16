import { notFound } from "next/navigation";

import { getGoal } from "@/actions/goals";
import { getProject, updateProject } from "@/actions/projects";
import { getProjectTasks } from "@/actions/tasks";
import { Header } from "@/components/layout/header";
import { EntityHeader } from "@/components/goals/entity-header";
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

  const active = tasks.filter((t) => !t.completed).length;
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress =
    total > 0 ? Math.round((done / total) * 100) : null;

  return (
    <>
      <Header title="Project" description={`Under ${goal.title}`} />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Breadcrumbs
          items={[
            { label: "Goals", href: "/goals" },
            { label: goal.title, href: `/goals/${goalId}` },
            { label: project.title },
          ]}
        />

        <EntityHeader
          title={project.title}
          description={project.description}
          meta={
            total === 0
              ? "No tasks yet"
              : `${done}/${total} done · ${active} open · ${progress}%`
          }
          progress={progress}
          onSave={updateProject.bind(null, goalId, projectId)}
        />

        <TaskForm projectId={projectId} variant="quick" />
        <TaskList tasks={tasks} mode="project" />
      </div>
    </>
  );
}
