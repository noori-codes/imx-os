"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import { toggleHabitToday } from "@/actions/habits";
import { toggleTaskComplete } from "@/actions/tasks";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { pickHeadlineQuad } from "@/lib/dashboard-headline";
import { isOverdue, startOfDay, toDateString } from "@/lib/date-utils";
import type {
  DashboardData,
  DashboardHabit,
  TaskWithContext,
  WeekDaySummary,
} from "@/types/dashboard";

type DashboardStageProps = {
  name: string;
  greeting: string;
  data: DashboardData;
};

type TaskToggle = { id: string; completed: boolean };
type HabitToggle = { id: string; completed: boolean };

function applyTaskToggle(
  tasks: TaskWithContext[],
  action: TaskToggle,
): TaskWithContext[] {
  return tasks.map((task) =>
    task.id === action.id ? { ...task, completed: action.completed } : task,
  );
}

function applyHabitToggle(
  habits: DashboardHabit[],
  action: HabitToggle,
): DashboardHabit[] {
  return habits.map((habit) => {
    if (habit.id !== action.id) return habit;

    const wasDone = habit.completed_today;
    const willBeDone = action.completed;
    let current_streak = habit.current_streak;

    if (!wasDone && willBeDone) current_streak += 1;
    if (wasDone && !willBeDone) current_streak = Math.max(0, current_streak - 1);

    return {
      ...habit,
      completed_today: willBeDone,
      current_streak,
      longest_streak: Math.max(habit.longest_streak, current_streak),
    };
  });
}

function weekWithTaskToggle(
  week: WeekDaySummary[],
  before: TaskWithContext[],
  after: TaskWithContext[],
  taskId: string,
): WeekDaySummary[] {
  const prev = before.find((task) => task.id === taskId);
  const next = after.find((task) => task.id === taskId);
  if (!prev?.due_date || !next) return week;

  const wasOpen = !prev.completed;
  const isOpen = !next.completed;
  if (wasOpen === isOpen) return week;

  const delta = wasOpen && !isOpen ? -1 : 1;
  return week.map((day) =>
    day.date === prev.due_date
      ? { ...day, task_count: Math.max(0, day.task_count + delta) }
      : day,
  );
}

export function DashboardStage({ name, greeting, data }: DashboardStageProps) {
  const [, startTransition] = useTransition();
  const todayStr = toDateString(startOfDay(new Date()));

  const [optimisticTasks, applyOptimisticTask] = useOptimistic(
    data.today_tasks,
    applyTaskToggle,
  );
  const [optimisticHabits, applyOptimisticHabit] = useOptimistic(
    data.habits_today,
    applyHabitToggle,
  );
  const [optimisticWeek, applyOptimisticWeek] = useOptimistic(
    data.week,
    (
      week: WeekDaySummary[],
      patch: {
        before: TaskWithContext[];
        after: TaskWithContext[];
        taskId: string;
      },
    ) => weekWithTaskToggle(week, patch.before, patch.after, patch.taskId),
  );

  const openTasks = optimisticTasks.filter((task) => !task.completed);
  const dueToday = openTasks.filter((task) => task.due_date === todayStr).length;
  const overdue = openTasks.filter(
    (task) => task.due_date && isOverdue(task.due_date),
  ).length;
  const habitsDone = optimisticHabits.filter((h) => h.completed_today).length;
  const headlineQuad = pickHeadlineQuad({
    overdue,
    dueToday,
    openTaskCount: openTasks.length,
    taskCount: optimisticTasks.length,
    habitsDone,
    habitsTotal: optimisticHabits.length,
    focusMinutes: data.stats.focus_minutes_today,
    week: optimisticWeek,
    goals: data.goals,
  });

  function onTaskToggle(taskId: string, completed: boolean) {
    const after = applyTaskToggle(optimisticTasks, { id: taskId, completed });
    startTransition(async () => {
      applyOptimisticTask({ id: taskId, completed });
      applyOptimisticWeek({
        before: optimisticTasks,
        after,
        taskId,
      });
      await toggleTaskComplete(taskId, completed);
    });
  }

  function onHabitToggle(habitId: string, completed: boolean) {
    startTransition(async () => {
      applyOptimisticHabit({ id: habitId, completed });
      await toggleHabitToday(habitId, completed);
    });
  }

  return (
    <>
      <DashboardHero
        name={name}
        greeting={greeting}
        intent={data.review.intent}
        dueToday={dueToday}
        overdue={overdue}
        focusMinutes={data.stats.focus_minutes_today}
        focusSessions={data.focus_today.sessions}
        habitsDone={habitsDone}
        habitsTotal={optimisticHabits.length}
        streak={data.stats.activity_streak}
        attention={dueToday + overdue}
      />

      <div className="dash-quad-shell">
        <div className="dash-quad grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1fr_1fr]">
          <div
            className="dash-quad-cell"
            data-quad="tasks"
            data-headline={headlineQuad === "tasks" ? "true" : undefined}
          >
            <TodayFocus tasks={optimisticTasks} onToggle={onTaskToggle} />
          </div>
          <div
            className="dash-quad-cell"
            data-quad="habits"
            data-headline={headlineQuad === "habits" ? "true" : undefined}
          >
            <HabitsToday
              habits={optimisticHabits}
              onToggle={onHabitToggle}
            />
          </div>
          <div
            className="dash-quad-cell"
            data-quad="week"
            data-headline={headlineQuad === "week" ? "true" : undefined}
          >
            <WeekOverview week={optimisticWeek} />
          </div>
          <div
            className="dash-quad-cell"
            data-quad="goals"
            data-headline={headlineQuad === "goals" ? "true" : undefined}
          >
            <GoalProgressList goals={data.goals} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/analytics"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {data.stats.activity_streak > 0
            ? `${data.stats.activity_streak}d · Analytics`
            : "Analytics"}
        </Link>
      </div>
    </>
  );
}
