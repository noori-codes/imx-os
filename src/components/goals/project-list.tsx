import Link from "next/link";
import { FolderKanban, ListTodo, Trash2 } from "lucide-react";

import { deleteProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import type { ProjectWithCounts } from "@/types/project";

type ProjectListProps = {
  goalId: string;
  projects: ProjectWithCounts[];
};

export function ProjectList({ goalId, projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <FolderKanban className="mb-3 size-8 text-muted-foreground" />
        <h3 className="font-medium">No projects yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a project to break this goal into actionable chunks.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => {
        const progress =
          project.task_count > 0
            ? Math.round(
                (project.completed_task_count / project.task_count) * 100,
              )
            : 0;

        return (
          <li
            key={project.id}
            className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <FolderKanban className="size-4 text-secondary-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/goals/${goalId}/projects/${project.id}`}
                className="text-base font-semibold hover:underline"
              >
                {project.title}
              </Link>

              {project.description ? (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ListTodo className="size-3" />
                  {project.completed_task_count}/{project.task_count} tasks done
                </span>
                {project.task_count > 0 ? (
                  <span>{progress}% complete</span>
                ) : null}
              </div>

              {project.task_count > 0 ? (
                <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>

            <form action={deleteProject.bind(null, goalId, project.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete project"
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
