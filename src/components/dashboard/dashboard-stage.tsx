"use client";

import { useOptimistic, useTransition } from "react";

import { toggleHabitToday } from "@/actions/habits";
import { toggleTaskComplete } from "@/actions/tasks";
import { DashboardAtmosphere } from "@/components/dashboard/dashboard-atmosphere";
import { DashboardInsightStrip } from "@/components/dashboard/dashboard-insight-strip";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
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
  const tasksDoneToday = optimisticTasks.filter((task) => task.completed).length;
  const activeDaysWeek = data.activity.days
    .slice(-7)
    .filter((day) => day.count > 0).length;

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
    <DashboardAtmosphere>
      <div className="dash-reveal">
        <DashboardWelcome
          name={name}
          greeting={greeting}
          intent={data.review.intent}
        />
      </div>

      <div className="dash-reveal dash-reveal-delay-1">
        <DashboardKpiRow
          dueToday={dueToday}
          overdue={overdue}
          focusMinutes={data.stats.focus_minutes_today}
          habitsDone={habitsDone}
          habitsTotal={optimisticHabits.length}
          streak={data.stats.activity_streak}
        />
      </div>

      <div className="dash-bento dash-reveal dash-reveal-delay-2">
        <div className="dash-bento-today min-h-88 lg:min-h-112">
          <TodayFocus tasks={optimisticTasks} onToggle={onTaskToggle} />
        </div>
        <div className="dash-bento-side flex min-h-0 flex-col gap-4">
          <div className="min-h-44 flex-1">
            <HabitsToday
              habits={optimisticHabits}
              onToggle={onHabitToggle}
            />
          </div>
          <div className="min-h-48 flex-1">
            <GoalProgressList goals={data.goals} />
          </div>
        </div>
        <div className="dash-bento-week">
          <WeekOverview week={optimisticWeek} />
        </div>
      </div>

      <div className="dash-reveal dash-reveal-delay-3">
        <DashboardInsightStrip
          focusMinutes={data.stats.focus_minutes_today}
          tasksDoneToday={tasksDoneToday}
          habitsDone={habitsDone}
          habitsTotal={optimisticHabits.length}
          streak={data.stats.activity_streak}
          activeDaysWeek={activeDaysWeek}
        />
      </div>
    </DashboardAtmosphere>
  );
}
