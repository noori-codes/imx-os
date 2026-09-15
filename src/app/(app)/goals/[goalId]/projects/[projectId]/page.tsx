import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getGoal } from "@/actions/goals";
import { getProject, updateProject } from "@/actions/projects";
import { getProjectTasks } from "@/actions/tasks";
import { EntityHeader } from "@/components/goals/entity-header";
import { GoalsStage } from "@/components/goals/goals-stage";
import { ProjectDetailSkeleton } from "@/components/goals/project-detail-skeleton";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";

type ProjectDetailPageProps = {
  params: Promise<{ goalId: string; projectId: string }>;
  searchParams: Promise<{ compose?: string }>;
};

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { goalId, projectId } = await params;
  const project = await getProject(goalId, projectId);
  if (!project) return { title: "Project" };
  return {
    title: project.title,
    description: project.description ?? undefined,
  };
}

async function ProjectDetailBody({
  goalId,
  projectId,
  compose,
}: {
  goalId: string;
  projectId: string;
  compose: boolean;
}) {
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

  const meta =
    total === 0
      ? "No tasks yet"
      : `${done}/${total} done · ${active} open · ${progress}%`;

  return (
    <>
      <Header chrome title={project.title} description={`${goal.title} · ${meta}`} />
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
              eyebrow="Project"
              title={project.title}
              description={project.description}
              meta={meta}
              progress={progress}
              sealed={total > 0 && active === 0}
              onSave={updateProject.bind(null, goalId, projectId)}
            />
          </div>

          <div className="goals-reveal goals-reveal-delay-2 space-y-5">
            <div className="goals-composer relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5" id="tasks-composer">
              <div className="goals-composer-glow" aria-hidden />
              <div className="relative z-1">
                <div className="mb-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Capture
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a task to this project. Schedule with chips.
                  </p>
                </div>
                <TaskForm
                  projectId={projectId}
                  variant="quick"
                  autoFocusTitle={compose}
                />
              </div>
            </div>
            <TaskList tasks={tasks} mode="project" />
          </div>
        </GoalsStage>
      </AppPageFrame>
    </>
  );
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { goalId, projectId } = await params;
  const compose = (await searchParams).compose === "1";

  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailBody
        goalId={goalId}
        projectId={projectId}
        compose={compose}
      />
    </Suspense>
  );
}
