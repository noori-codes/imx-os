import { notFound } from "next/navigation";

import { getGoal } from "@/actions/goals";
import { getProject, updateProject } from "@/actions/projects";
import { getProjectTasks } from "@/actions/tasks";
import { Header } from "@/components/layout/header";
import { EntityHeader } from "@/components/goals/entity-header";
import { GoalsStage } from "@/components/goals/goals-stage";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { AppPageFrame } from "@/components/shared/app-page-frame";
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
  const progress = total > 0 ? Math.round((done / total) * 100) : null;

  return (
    <>
      <Header title="Project" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <GoalsStage>
          <div className="goals-reveal">
            <Breadcrumbs
              items={[
                { label: "Goals", href: "/goals" },
                { label: goal.title, href: `/goals/${goalId}` },
                { label: project.title },
              ]}
            />
          </div>

          <div className="goals-reveal goals-reveal-delay-1">
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
          </div>

          <div className="goals-reveal goals-reveal-delay-2 space-y-5">
            <div className="goals-composer rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
              <div className="mb-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Capture
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a task to this project. Schedule with chips.
                </p>
              </div>
              <TaskForm projectId={projectId} variant="quick" />
            </div>
            <TaskList tasks={tasks} mode="project" />
          </div>
        </GoalsStage>
      </AppPageFrame>
    </>
  );
}
