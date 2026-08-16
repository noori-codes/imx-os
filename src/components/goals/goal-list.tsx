"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Pencil, Target, Trash2, X } from "lucide-react";

import { deleteGoal, updateGoal } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GoalWithCounts } from "@/types/goal";

type GoalListProps = {
  goals: GoalWithCounts[];
};

function progressPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function GoalList({ goals }: GoalListProps) {
  const [optimisticGoals, removeOptimistic] = useOptimistic(
    goals,
    (current: GoalWithCounts[], id: string) =>
      current.filter((g) => g.id !== id),
  );

  if (optimisticGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Target className="mb-3 size-8 text-muted-foreground" />
        <h3 className="text-base font-medium">No goals yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Goals are outcomes. Break them into projects, then tasks.
        </p>
      </div>
    );
  }

  return (
    <ul className="border-t border-border/60">
      {optimisticGoals.map((goal) => (
        <GoalRow
          key={goal.id}
          goal={goal}
          onOptimisticDelete={() => removeOptimistic(goal.id)}
        />
      ))}
    </ul>
  );
}

function GoalRow({
  goal,
  onOptimisticDelete,
}: {
  goal: GoalWithCounts;
  onOptimisticDelete: () => void;
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const progress = progressPercent(
    goal.completed_task_count,
    goal.task_count,
  );

  function handleDelete() {
    const detail =
      goal.project_count > 0
        ? `This deletes ${goal.project_count} project${goal.project_count === 1 ? "" : "s"} and ${goal.task_count} task${goal.task_count === 1 ? "" : "s"}.`
        : "This cannot be undone.";
    if (!window.confirm(`Delete “${goal.title}”?\n\n${detail}`)) return;

    startTransition(async () => {
      onOptimisticDelete();
      await deleteGoal(goal.id);
    });
  }

  function saveEdit() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Title is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateGoal(goal.id, {
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
      <li className="border-b border-border/50 py-4">
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
            aria-label="Goal title"
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
            >
              <X className="size-4" />
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </li>
    );
  }

  return (
    <li className="group border-b border-border/50 py-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/goals/${goal.id}`}
            className="text-sm font-semibold tracking-tight hover:underline"
          >
            {goal.title}
          </Link>
          {goal.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {goal.description}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {goal.project_count} project
            {goal.project_count === 1 ? "" : "s"}
            {goal.task_count > 0
              ? ` · ${goal.completed_task_count}/${goal.task_count} tasks`
              : null}
            {goal.task_count > 0 ? ` · ${progress}%` : null}
          </p>
          {goal.task_count > 0 ? (
            <div className="mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-muted">
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
              setTitle(goal.title);
              setDescription(goal.description ?? "");
              setError(null);
              setEditing(true);
            }}
            aria-label="Edit goal"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            aria-label="Delete goal"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}
