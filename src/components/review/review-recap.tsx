"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { BookOpen, CheckCircle2, Circle, Timer } from "lucide-react";

import { toggleHabitOnDate } from "@/actions/habits";
import { createNote } from "@/actions/notes";
import { toggleTaskComplete, updateTask } from "@/actions/tasks";
import { calendarHref } from "@/lib/calendar";
import {
  addDays,
  parseDateString,
  startOfDay,
  toDateString,
} from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";
import type { ReviewHabit, ReviewRecap, ReviewTask } from "@/types/review";

type ReviewRecapCardProps = {
  recap: ReviewRecap;
};

export function ReviewRecapCard({ recap }: ReviewRecapCardProps) {
  const [, startTransition] = useTransition();
  const [habits, setHabits] = useState(recap.habits);
  const [dueTasks, setDueTasks] = useState(recap.tasks_due);
  const [completedTasks, setCompletedTasks] = useState(recap.tasks_completed);

  useEffect(() => {
    setHabits(recap.habits);
    setDueTasks(recap.tasks_due);
    setCompletedTasks(recap.tasks_completed);
  }, [recap]);

  const openDue = dueTasks.filter((task) => !task.completed);

  function toggleHabit(habit: ReviewHabit) {
    const next = !habit.completed;
    setHabits((prev) =>
      prev.map((item) =>
        item.id === habit.id ? { ...item, completed: next } : item,
      ),
    );
    startTransition(async () => {
      const result = await toggleHabitOnDate(habit.id, recap.date, next);
      if (result.error) {
        setHabits((prev) =>
          prev.map((item) =>
            item.id === habit.id ? { ...item, completed: !next } : item,
          ),
        );
        imxToast("Couldn’t update habit", {
          description: result.error,
          tone: "error",
        });
      }
    });
  }

  function toggleTask(task: ReviewTask) {
    const next = !task.completed;
    if (next) {
      setDueTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, completed: true } : item,
        ),
      );
      setCompletedTasks((prev) =>
        prev.some((item) => item.id === task.id)
          ? prev
          : [{ ...task, completed: true }, ...prev],
      );
    } else {
      setCompletedTasks((prev) => prev.filter((item) => item.id !== task.id));
      setDueTasks((prev) => {
        if (prev.some((item) => item.id === task.id)) {
          return prev.map((item) =>
            item.id === task.id ? { ...item, completed: false } : item,
          );
        }
        return [{ ...task, completed: false }, ...prev];
      });
    }

    startTransition(async () => {
      const result = await toggleTaskComplete(task.id, next);
      if (result.error) {
        setDueTasks(recap.tasks_due);
        setCompletedTasks(recap.tasks_completed);
        imxToast("Couldn’t update task", {
          description: result.error,
          tone: "error",
        });
      }
    });
  }

  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));

  function scheduleTask(task: ReviewTask, nextDue: string | null) {
    if (nextDue !== recap.date) {
      setDueTasks((prev) => prev.filter((item) => item.id !== task.id));
    } else {
      setDueTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, due_date: nextDue } : item,
        ),
      );
    }

    startTransition(async () => {
      const result = await updateTask(task.id, {
        title: task.title,
        due_date: nextDue,
      });
      if (result.error) {
        setDueTasks((prev) => {
          if (prev.some((item) => item.id === task.id)) {
            return prev.map((item) =>
              item.id === task.id
                ? { ...item, due_date: task.due_date }
                : item,
            );
          }
          return [{ ...task, completed: false }, ...prev];
        });
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
    <aside className="review-recap relative overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80">
      <div className="review-dock-glow" aria-hidden />
      <div className="relative z-1 border-b border-border/40 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Day pulse
        </p>
        <h3 className="mt-1 text-sm font-semibold text-foreground">
          At a glance
        </h3>
      </div>

      <div className="relative z-1 space-y-5 px-5 py-4">
        {recap.has_journal && recap.journal_id ? (
          <Link
            href={`/notes/${recap.journal_id}`}
            className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-amber-500/15"
          >
            <BookOpen className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
            Open today&apos;s journal
          </Link>
        ) : (
          <form action={createNote.bind(null, "journal", recap.date)}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl border border-border/50 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <BookOpen className="size-4 shrink-0" />
              Write a journal entry
            </button>
          </form>
        )}

        {recap.events_count > 0 ? (
          <Link
            href={calendarHref("week", recap.date)}
            className="block text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {recap.events_count} calendar event
            {recap.events_count === 1 ? "" : "s"} today
          </Link>
        ) : null}

        {habits.length > 0 ? (
          <section>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Habits
            </h4>
            <ul className="mt-2.5 space-y-1">
              {habits.map((habit) => (
                <li key={habit.id}>
                  <button
                    type="button"
                    onClick={() => toggleHabit(habit)}
                    aria-pressed={habit.completed}
                    className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    {habit.completed ? (
                      <CheckCircle2
                        className="size-4 shrink-0"
                        style={{ color: habit.color }}
                      />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <span
                      className={cn(
                        habit.completed
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {habit.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {openDue.length > 0 ? (
          <section id="review-still-due" className="scroll-mt-24">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Still due
              </h4>
              <Link
                href="/tasks?compose=1"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Tasks
              </Link>
            </div>
            <ul className="mt-2.5 space-y-2">
              {openDue.map((task) => {
                const deferBase = task.due_date
                  ? parseDateString(task.due_date)
                  : startOfDay(new Date());
                const plusOne = toDateString(addDays(deferBase, 1));
                const nextWeek = toDateString(addDays(deferBase, 7));
                return (
                  <li key={task.id} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleTask(task)}
                        aria-pressed={false}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                      >
                        <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 truncate">
                          {task.title}
                          {task.due_date && task.due_date < recap.date ? (
                            <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                              overdue · {task.due_date.slice(5)}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <Link
                        href={`/focus?task=${task.id}`}
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Focus on ${task.title}`}
                      >
                        <Timer className="size-3.5" />
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 pl-7">
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
                          onClick={() => scheduleTask(task, chip.value)}
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
                          onClick={() => scheduleTask(task, null)}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {completedTasks.length > 0 ? (
          <section>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Completed
            </h4>
            <ul className="mt-2.5 space-y-1">
              {completedTasks.slice(0, 8).map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    aria-pressed={true}
                    className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    <CheckCircle2 className="size-3.5 shrink-0 text-foreground/55" />
                    <span className="truncate line-through">{task.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {habits.length === 0 &&
        openDue.length === 0 &&
        completedTasks.length === 0 &&
        !recap.has_journal ? (
          <p className="text-sm text-muted-foreground">
            Quiet day so far — room to begin.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
