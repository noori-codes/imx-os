"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Pencil,
  Search,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { deleteGoal, updateGoal } from "@/actions/goals";
import { GoalForm } from "@/components/goals/goal-form";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  goalMotion,
  goalMotionLabel,
  goalProgressPercent,
  pickSpotlightGoal,
  type GoalMotion,
} from "@/lib/goal-status";
import { cn } from "@/lib/utils";
import type { GoalWithCounts } from "@/types/goal";

type Filter = "all" | GoalMotion;

type GoalsBoardProps = {
  goals: GoalWithCounts[];
};

function ProgressRing({
  progress,
  size = 72,
  stroke = 5,
  className,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, progress)) / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 -rotate-90", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/70"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-foreground transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

function MotionBadge({ motion }: { motion: GoalMotion }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
        motion === "quiet" && "bg-muted/70 text-muted-foreground",
        motion === "in_motion" && "bg-foreground/10 text-foreground",
        motion === "closing_in" && "bg-foreground/15 text-foreground",
        motion === "complete" && "bg-muted text-muted-foreground",
      )}
    >
      {goalMotionLabel(motion)}
    </span>
  );
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_motion", label: "In motion" },
  { id: "closing_in", label: "Closing in" },
  { id: "quiet", label: "Quiet" },
  { id: "complete", label: "Complete" },
];

export function GoalsBoard({ goals }: GoalsBoardProps) {
  const [optimisticGoals, removeOptimistic] = useOptimistic(
    goals,
    (current: GoalWithCounts[], id: string) =>
      current.filter((g) => g.id !== id),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const spotlight = useMemo(
    () => pickSpotlightGoal(optimisticGoals),
    [optimisticGoals],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimisticGoals.filter((goal) => {
      const motion = goalMotion(goal);
      if (filter !== "all" && motion !== filter) return false;
      if (!q) return true;
      return (
        goal.title.toLowerCase().includes(q) ||
        (goal.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [optimisticGoals, filter, query]);

  return (
    <div className="flex flex-col gap-6">
      {spotlight ? <GoalsSpotlight goal={spotlight} /> : null}

      <div className="goals-composer rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Declare
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Name an outcome. Projects and tasks live underneath.
            </p>
          </div>
        </div>
        <GoalForm variant="composer" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search goals…"
            className="h-9 border-border/50 bg-card/80 pl-9"
            aria-label="Search goals"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === item.id
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
          <Target className="mb-3 size-8 text-muted-foreground" />
          <h3 className="text-base font-medium">
            {optimisticGoals.length === 0 ? "No goals yet" : "Nothing matches"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {optimisticGoals.length === 0
              ? "Goals are outcomes. Break them into projects, then tasks."
              : "Try another filter or clear the search."}
          </p>
        </div>
      ) : (
        <ul className="goals-grid grid gap-3 sm:grid-cols-2">
          {filtered.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={index}
              onOptimisticDelete={() => removeOptimistic(goal.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalsSpotlight({ goal }: { goal: GoalWithCounts }) {
  const progress = goalProgressPercent(goal);
  const motion = goalMotion(goal);
  const hasTasks = goal.task_count > 0;

  return (
    <section className="goals-spotlight relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 px-5 py-5 sm:px-7 sm:py-6">
      <div className="goals-spotlight-glow" aria-hidden />
      <div className="relative z-1 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {motion === "complete" ? "North star cleared" : "Closest finish"}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <Link
              href={`/goals/${goal.id}`}
              className="transition-colors hover:text-foreground/80"
            >
              {goal.title}
            </Link>
          </h3>
          {goal.description ? (
            <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground">
              {goal.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <MotionBadge motion={motion} />
            <span className="text-xs text-muted-foreground">
              {goal.project_count} project
              {goal.project_count === 1 ? "" : "s"}
              {hasTasks
                ? ` · ${goal.completed_task_count}/${goal.task_count} tasks`
                : " · awaiting tasks"}
            </span>
          </div>
          <Link
            href={`/goals/${goal.id}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
          >
            Open goal
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="relative mx-auto flex size-28 items-center justify-center sm:mx-0">
          <ProgressRing progress={hasTasks ? progress : 0} size={112} stroke={6} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {hasTasks ? `${progress}%` : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {hasTasks ? "done" : "seed"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function GoalCard({
  goal,
  index,
  onOptimisticDelete,
}: {
  goal: GoalWithCounts;
  index: number;
  onOptimisticDelete: () => void;
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const progress = goalProgressPercent(goal);
  const motion = goalMotion(goal);
  const hasTasks = goal.task_count > 0;

  function handleDelete() {
    const detail =
      goal.project_count > 0
        ? `This deletes ${goal.project_count} project${goal.project_count === 1 ? "" : "s"} and ${goal.task_count} task${goal.task_count === 1 ? "" : "s"}.`
        : "This cannot be undone.";
    void (async () => {
      const ok = await confirm({
        title: `Delete “${goal.title}”?`,
        description: detail,
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      startTransition(async () => {
        onOptimisticDelete();
        await deleteGoal(goal.id);
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
      <li
        className="goals-card rounded-2xl border border-border/50 bg-card/80 p-4"
        style={{ ["--i" as string]: index }}
      >
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
    <li
      className="goals-card group relative rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-border"
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex size-14 shrink-0 items-center justify-center">
          <ProgressRing
            progress={hasTasks ? progress : 0}
            size={56}
            stroke={4}
            className="absolute inset-0"
          />
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {hasTasks ? `${progress}` : "·"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/goals/${goal.id}`}
              className="text-sm font-semibold tracking-tight text-foreground hover:underline"
            >
              {goal.title}
            </Link>
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

          {goal.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {goal.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <MotionBadge motion={motion} />
            <span className="text-xs text-muted-foreground">
              {goal.project_count} project
              {goal.project_count === 1 ? "" : "s"}
              {hasTasks
                ? ` · ${goal.completed_task_count}/${goal.task_count}`
                : null}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
