"use client";

import { useOptimistic, useTransition } from "react";

import { toggleHabitToday } from "@/actions/habits";
import { toggleTaskComplete } from "@/actions/tasks";
import { DashboardAtmosphere } from "@/components/dashboard/dashboard-atmosphere";
import { DashboardContinueChip } from "@/components/dashboard/dashboard-continue-chip";
import { DashboardFocusMeter } from "@/components/dashboard/dashboard-focus-meter";
import { DashboardHomeHeader } from "@/components/dashboard/dashboard-home-header";
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis";
import { DashboardSpotlight } from "@/components/dashboard/dashboard-spotlight";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { MorningPlan } from "@/components/dashboard/morning-plan";
import { StreakShield } from "@/components/dashboard/streak-shield";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
import {
  REVEAL_DELAY,
  SectionReveal,
} from "@/components/motion/section-reveal";
import {
  celebrateMeaningfulClear,
  softCompletePulse,
  softCompleteToast,
} from "@/lib/completion-payoff";
import { isOverdue, startOfDay, toDateString } from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
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
  focusGoalMinutes: number;
  streakFreezesRemaining?: number;
};

type TaskToggle = { id: string; completed: boolean };
type HabitToggle = { id: string; completed: boolean };
type TaskDuePatch = { id: string; due_date: string | null };

function staysOnTodayDeck(dueDate: string | null, today: string) {
  if (!dueDate) return false;
  return dueDate <= today;
}

function applyTaskToggle(
  tasks: TaskWithContext[],
  action: TaskToggle,
): TaskWithContext[] {
  return tasks.map((task) =>
    task.id === action.id ? { ...task, completed: action.completed } : task,
  );
}

function applyTaskDue(
  tasks: TaskWithContext[],
  action: TaskDuePatch,
  today: string,
): TaskWithContext[] {
  return tasks
    .map((task) =>
      task.id === action.id ? { ...task, due_date: action.due_date } : task,
    )
    .filter(
      (task) =>
        task.id !== action.id || staysOnTodayDeck(task.due_date, today),
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

/**
 * Modern bento home — masthead → KPIs → Today hero + side tiles → week row.
 */
export function DashboardStage({
  name,
  greeting,
  data,
  focusGoalMinutes,
  streakFreezesRemaining = 1,
}: DashboardStageProps) {
  const [, startTransition] = useTransition();
  const todayStr = toDateString(startOfDay(new Date()));
  const activeDates = data.activity.days
    .filter((day) => day.count > 0)
    .map((day) => day.date);

  const [optimisticTasks, applyOptimisticTask] = useOptimistic(
    data.today_tasks,
    (
      tasks: TaskWithContext[],
      action: TaskToggle | (TaskDuePatch & { kind: "due" }),
    ) => {
      if ("kind" in action) {
        return applyTaskDue(tasks, action, todayStr);
      }
      return applyTaskToggle(tasks, action);
    },
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
  const focusMinutes =
    data.focus_today.focus_minutes || data.stats.focus_minutes_today;
  const focusSessions = data.focus_today.sessions;
  const dueOpen = dueToday + overdue;

  function onTaskToggle(taskId: string, completed: boolean) {
    const after = applyTaskToggle(optimisticTasks, { id: taskId, completed });
    const openAfter = after.filter((task) => !task.completed);
    if (completed) {
      if (openAfter.length === 0 && openTasks.length > 0) {
        celebrateMeaningfulClear("today");
      } else {
        softCompletePulse();
      }
    }
    startTransition(async () => {
      applyOptimisticTask({ id: taskId, completed });
      applyOptimisticWeek({
        before: optimisticTasks,
        after,
        taskId,
      });
      const result = await toggleTaskComplete(taskId, completed);
      if (result.error) {
        const rolled = applyTaskToggle(after, {
          id: taskId,
          completed: !completed,
        });
        applyOptimisticTask({ id: taskId, completed: !completed });
        applyOptimisticWeek({
          before: after,
          after: rolled,
          taskId,
        });
        imxToast("Couldn’t update task", {
          description: result.error,
          tone: "error",
        });
      }
    });
  }

  function onTaskSchedule(taskId: string, dueDate: string | null) {
    startTransition(() => {
      applyOptimisticTask({ kind: "due", id: taskId, due_date: dueDate });
    });
  }

  function onHabitToggle(habitId: string, completed: boolean) {
    const after = applyHabitToggle(optimisticHabits, {
      id: habitId,
      completed,
    });
    const doneAfter = after.filter((h) => h.completed_today).length;
    if (completed) {
      if (after.length > 0 && doneAfter === after.length) {
        softCompleteToast("Habits sealed");
      } else {
        softCompletePulse();
      }
    }
    startTransition(async () => {
      applyOptimisticHabit({ id: habitId, completed });
      const result = await toggleHabitToday(habitId, completed);
      if (result.error) {
        applyOptimisticHabit({ id: habitId, completed: !completed });
        imxToast("Couldn’t update habit", {
          description: result.error,
          tone: "error",
        });
      }
    });
  }

  return (
    <DashboardAtmosphere>
      <section className="dash-desk-top">
        <DashboardHomeHeader
          name={name}
          greeting={greeting}
          intent={data.review.intent}
          hasTodayReview={data.review.has_today}
        />

        <SectionReveal delay={REVEAL_DELAY[1]} className="dash-desk-aside">
          <DashboardContinueChip />
          <StreakShield
            activeDates={activeDates}
            streak={data.stats.activity_streak}
            freezesRemaining={streakFreezesRemaining}
            riskOnly
          />
        </SectionReveal>

        <DashboardKpis
          dueOpen={dueOpen}
          overdue={overdue}
          habitsDone={habitsDone}
          habitsTotal={optimisticHabits.length}
          focusMinutes={focusMinutes}
          focusGoalMinutes={focusGoalMinutes}
          streak={data.stats.activity_streak}
        />

        <SectionReveal delay={REVEAL_DELAY[1]}>
          <MorningPlan
            date={todayStr}
            tasks={optimisticTasks}
            habits={optimisticHabits}
          />
        </SectionReveal>
      </section>

      <SectionReveal delay={REVEAL_DELAY[2]} className="dash-bento">
        <div className="dash-bento-today">
          <TodayFocus
            tasks={optimisticTasks}
            overdueTasks={data.overdue_tasks}
            onToggle={onTaskToggle}
            onSchedule={onTaskSchedule}
            focusMinutes={focusMinutes}
            focusGoalMinutes={focusGoalMinutes}
          />
        </div>
        <div className="dash-bento-habits">
          <HabitsToday habits={optimisticHabits} onToggle={onHabitToggle} />
        </div>
        <div className="dash-bento-focus">
          <DashboardFocusMeter
            focusMinutes={focusMinutes}
            focusGoalMinutes={focusGoalMinutes}
            sessions={focusSessions}
          />
        </div>
        <div className="dash-bento-week">
          <WeekOverview week={optimisticWeek} />
        </div>
        <div className="dash-bento-spot">
          <DashboardSpotlight
            goals={data.goals}
            readingBook={data.reading_book}
          />
        </div>
      </SectionReveal>
    </DashboardAtmosphere>
  );
}
