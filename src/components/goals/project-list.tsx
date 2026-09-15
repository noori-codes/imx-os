"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { FolderKanban, Pencil, Trash2, X } from "lucide-react";

import { deleteProject, updateProject } from "@/actions/projects";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { imxToast } from "@/lib/imx-toast";
import type { ProjectWithCounts } from "@/types/project";

type ProjectListProps = {
  goalId: string;
  projects: ProjectWithCounts[];
};

function progressPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function ProjectList({ goalId, projects }: ProjectListProps) {
  const [optimisticProjects, removeOptimistic] = useOptimistic(
    projects,
    (current: ProjectWithCounts[], id: string) =>
      current.filter((p) => p.id !== id),
  );

  if (optimisticProjects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Add a project to break this goal into chunks."
        className="py-12"
      >
        <Button
          type="button"
          className="mt-5"
          onClick={() => {
            const root = document.querySelector(".goals-composer");
            root?.scrollIntoView({ behavior: "smooth", block: "center" });
            root
              ?.querySelector<HTMLInputElement>("input[name=title]")
              ?.focus({ preventScroll: true });
          }}
        >
          Add a project
        </Button>
      </EmptyState>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {optimisticProjects.map((project) => (
        <ProjectRow
          key={project.id}
          goalId={goalId}
          project={project}
          onOptimisticDelete={() => removeOptimistic(project.id)}
        />
      ))}
    </ul>
  );
}

function ProjectRow({
  goalId,
  project,
  onOptimisticDelete,
}: {
  goalId: string;
  project: ProjectWithCounts;
  onOptimisticDelete: () => void;
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const progress = progressPercent(
    project.completed_task_count,
    project.task_count,
  );

  function handleDelete() {
    const detail =
      project.task_count > 0
        ? `This also deletes ${project.task_count} task${project.task_count === 1 ? "" : "s"}.`
        : "This cannot be undone.";
    void (async () => {
      const ok = await confirm({
        title: `Delete “${project.title}”?`,
        description: detail,
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      startTransition(async () => {
        onOptimisticDelete();
        await deleteProject(goalId, project.id);
        imxToast("Project deleted", { tone: "success" });
      });
    })();
  }

  function saveEdit() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Title is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateProject(goalId, project.id, {
        title: nextTitle,
        description: description.trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setError(null);
    });
  }

  if (editing) {
    return (
      <li className="rounded-2xl border border-border/50 bg-card/80 p-4">
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            aria-label="Project title"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "project-edit-error" : undefined}
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveEdit}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              aria-label="Cancel edit"
            >
              <X className="size-4" />
            </Button>
          </div>
          {error ? (
            <p
              id="project-edit-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <li className="group rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-border">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/goals/${goalId}/projects/${project.id}`}
            className="text-sm font-semibold tracking-tight hover:underline"
          >
            {project.title}
          </Link>
          {project.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {project.task_count === 0 ? (
              <Link
                href={`/goals/${goalId}/projects/${project.id}?compose=1`}
                className="font-medium text-foreground/80 underline-offset-2 hover:underline"
              >
                Add task
              </Link>
            ) : (
              `${project.completed_task_count}/${project.task_count} tasks · ${progress}%`
            )}
          </p>
          {project.task_count > 0 ? (
            <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/80 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() => {
              setTitle(project.title);
              setDescription(project.description ?? "");
              setError(null);
              setEditing(true);
            }}
            aria-label="Edit project"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            aria-label="Delete project"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}
