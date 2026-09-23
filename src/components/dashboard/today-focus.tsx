"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CheckCircle2, Circle, Timer } from "lucide-react";

import { updateTask } from "@/actions/tasks";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import {
  addDays,
  isOverdue,
  parseDateString,
  startOfDay,
  toDateString,
} from "@/lib/date-utils";
import { readContinuePointer } from "@/lib/imx-continue";
import { imxToast } from "@/lib/imx-toast";
import {
  rankSmartToday,
  smartReasonLabel,
  type SmartReason,
} from "@/lib/smart-today";
import { cn } from "@/lib/utils";
import type { TaskWithContext } from "@/types/dashboard";
import { formatFocusMinutes } from "@/types/focus";

type TodayFocusProps = {
  tasks: TaskWithContext[];
  overdueTasks?: TaskWithContext[];
  onToggle: (taskId: string, completed: boolean) => void;
  onSchedule?: (taskId: string, dueDate: string | null) => void;
  focusMinutes?: number;
  focusGoalMinutes?: number;
};


function reasonTone(reason: SmartReason) {
  if (reason === "focus") {
    return "border-foreground/20 bg-foreground/8 text-foreground";
  }
  return "border-border/50 bg-muted/40 text-muted-foreground";
}

function TaskRow({
  task,
  index,
  flash,
  reason,
  onToggle,
  onSchedule,
}: {
  task: TaskWithContext;
  index: number;
  flash: boolean;
  reason: SmartReason;
  onToggle: (taskId: string, completed: boolean) => void;
  onSchedule?: (taskId: string, dueDate: string | null) => void;
}) {
  const [, startTransition] = useTransition();
  const overdue = Boolean(
    task.due_date && !task.completed && isOverdue(task.due_date),
  );

  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));
  const deferBase = task.due_date
    ? parseDateString(task.due_date)
    : startOfDay(new Date());
  const plusOne = toDateString(addDays(deferBase, 1));
  const nextWeek = toDateString(addDays(deferBase, 7));

  function schedule(nextDue: string | null) {
    startTransition(async () => {
      onSchedule?.(task.id, nextDue);
      const result = await updateTask(task.id, {
        title: task.title,
        due_date: nextDue,
        recurrence: task.recurrence,
      });
      if (result.error) {
        imxToast("Couldn’t update due date", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast(
        nextDue === null
          ? "Cleared due date"
          : nextDue === today
            ? "Due today"
            : nextDue === tomorrow
              ? "Due tomorrow"
              : "Due date updated",
        { tone: "success" },
      );
    });
  }

  return (
    <li
      className={cn(
        "group flex flex-col gap-1.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40",
        flash && "dash-task-row-done",
      )}
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggle(task.id, !task.completed)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          aria-pressed={task.completed}
        >
          {task.completed ? (
            <CheckCircle2 className="size-5 text-foreground/75" />
          ) : (
            <Circle className="size-5 transition-colors group-hover:text-foreground" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium text-foreground transition-colors duration-150",
              task.completed && "text-muted-foreground/70 line-through",
            )}
          >
            {task.title}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide",
                reason === "overdue" || overdue
                  ? "border-destructive/25 bg-destructive/10 text-destructive/85"
                  : reasonTone(reason),
              )}
            >
              {smartReasonLabel(reason)}
            </span>
            {task.context ? (
              <span className="truncate text-[11px] text-muted-foreground">
                {task.context}
              </span>
            ) : null}
          </div>
        </div>

        {!task.completed ? (
          <Link
            href={`/focus?task=${task.id}`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-100 transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            aria-label="Focus on this task"
          >
            <Timer className="size-3.5" />
          </Link>
        ) : null}
      </div>

      {!task.completed ? (
        <div className="flex flex-wrap items-center gap-1 pl-10">
          {(
            [
              { label: "Today", value: today },
              { label: "Tmrw", value: tomorrow },
              { label: "+1d", value: plusOne },
              { label: "+1w", value: nextWeek },
            ] as const
          ).map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => schedule(chip.value)}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                task.due_date === chip.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
          {task.due_date ? (
            <button
              type="button"
              onClick={() => schedule(null)}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function TodayFocus({
  tasks,
  overdueTasks = [],
  onToggle,
  onSchedule,
  focusMinutes = 0,
  focusGoalMinutes = 0,
}: TodayFocusProps) {
  const [continueHref, setContinueHref] = useState<string | null>(null);
  const smart = useMemo(
    () => rankSmartToday(tasks, overdueTasks, continueHref),
    [tasks, overdueTasks, continueHref],
  );
  const openCount = smart.length;
  const clear = tasks.length > 0 && tasks.every((t) => t.completed) && openCount === 0;
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);
  const [celebrateClear, setCelebrateClear] = useState(false);
  const prevClear = useRef(clear);
  const mounted = useRef(false);

  useEffect(() => {
    function refresh() {
      setContinueHref(readContinuePointer()?.href ?? null);
    }
    refresh();
    window.addEventListener("imx:continue-updated", refresh);
    return () => window.removeEventListener("imx:continue-updated", refresh);
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevClear.current = clear;
      return;
    }
    if (clear && !prevClear.current) {
      setCelebrateClear(true);
      const timer = window.setTimeout(() => setCelebrateClear(false), 720);
      prevClear.current = clear;
      return () => window.clearTimeout(timer);
    }
    prevClear.current = clear;
  }, [clear]);

  function handleToggle(taskId: string, completed: boolean) {
    if (completed) {
      setFlashTaskId(taskId);
      window.setTimeout(() => setFlashTaskId(null), 500);
    }
    onToggle(taskId, completed);
  }

  return (
    <section
      className={cn(
        "dash-panel relative flex h-full min-h-0 flex-col overflow-hidden",
        celebrateClear && "dash-signal-celebrate",
      )}
    >
      <div className="dash-panel-glow" aria-hidden="true" />
      <div className="relative z-1 flex items-center justify-between gap-3 border-b border-border/25 px-5 py-3.5">
        <div>
          <p className="dash-panel-eyebrow">Smart today</p>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
            Today
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {smart.length === 0
              ? "Nothing due"
              : clear
                ? "All clear"
                : `${openCount} prioritized`}
          </p>
        </div>
        <Link
          href="/tasks?view=today"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      {smart.length === 0 ? (
        <div className="relative z-1 flex min-h-0 flex-1 flex-col gap-6 px-5 py-5 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="min-w-0 max-w-md">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Open deck
              </p>
              <p className="mt-2 text-base font-medium tracking-tight text-foreground">
                Nothing due — start the day on purpose.
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Capture a task, cue a habit, or open Focus. The room stays quiet
                until you light it.
              </p>
            </div>
            {focusGoalMinutes > 0 ? (
              <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
                <ProgressRing
                  value={Math.min(
                    100,
                    Math.round((focusMinutes / focusGoalMinutes) * 100),
                  )}
                  size={64}
                  stroke={4}
                  featured
                  sealed={focusMinutes >= focusGoalMinutes}
                >
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {focusMinutes >= focusGoalMinutes
                      ? "✓"
                      : `${Math.min(100, Math.round((focusMinutes / focusGoalMinutes) * 100))}%`}
                  </span>
                </ProgressRing>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Focus goal
                  </p>
                  <p className="mt-0.5 text-sm tabular-nums text-foreground">
                    {formatFocusMinutes(focusMinutes)}
                    <span className="text-muted-foreground">
                      {" "}
                      / {formatFocusMinutes(focusGoalMinutes)}
                    </span>
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Link
              href="/tasks?compose=1"
              className="inline-flex h-9 items-center rounded-xl bg-foreground px-3.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Add a task
            </Link>
            <Link
              href="/habits?compose=1"
              className="inline-flex h-9 items-center rounded-xl border border-surface-border bg-surface px-3.5 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              Cue a habit
            </Link>
            <Link
              href="/focus"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              <Timer className="size-3.5 opacity-70" aria-hidden />
              Open Focus
            </Link>
          </div>
        </div>
      ) : (
        <ul className="dash-stagger relative z-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {smart.map((item, index) => (
            <TaskRow
              key={item.task.id}
              task={item.task}
              index={index}
              reason={item.reason}
              flash={flashTaskId === item.task.id}
              onToggle={handleToggle}
              onSchedule={onSchedule}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
