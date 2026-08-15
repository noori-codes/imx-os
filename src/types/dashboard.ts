import {
  computeStreaks,
  formatShortDate,
  formatShortWeekday,
  getPastDays,
  getWeekDays,
  isOverdue,
  startOfDay,
  toDateString,
} from "@/lib/date-utils";
import type { Task } from "@/types/task";

export type TaskWithContext = Task & {
  context: string | null;
  context_href: string | null;
};

export type DashboardStats = {
  active_tasks: number;
  completed_tasks: number;
  due_today: number;
  overdue: number;
  goals: number;
  projects: number;
  focus_minutes_today: number;
  habits_done: number;
  habits_total: number;
  activity_streak: number;
};

export type WeekDaySummary = {
  date: string;
  label: string;
  day_label: string;
  task_count: number;
  is_today: boolean;
};

export type GoalProgress = {
  id: string;
  title: string;
  task_count: number;
  completed_task_count: number;
  progress: number;
};

export type ActivityDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type ActivitySummary = {
  days: ActivityDay[];
  total: number;
  active_days: number;
  current_streak: number;
};

export type DashboardHabit = {
  id: string;
  title: string;
  color: string;
  completed_today: boolean;
  current_streak: number;
  longest_streak: number;
};

export type NextStep = {
  id: string;
  kind: "task" | "habit" | "review" | "focus" | "setup";
  title: string;
  href: string;
  detail?: string;
};

export type DashboardData = {
  stats: DashboardStats;
  today_tasks: TaskWithContext[];
  overdue_tasks: TaskWithContext[];
  next_tasks: TaskWithContext[];
  week: WeekDaySummary[];
  goals: GoalProgress[];
  activity: ActivitySummary;
  habits_today: DashboardHabit[];
  focus_today: { sessions: number; focus_minutes: number };
  review: {
    has_today: boolean;
    intent: string | null;
  };
  next_steps: NextStep[];
  is_new_user: boolean;
};

export function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function buildActivitySummary(
  countsByDate: Map<string, number>,
  rangeDays: number,
): ActivitySummary {
  const days = getPastDays(rangeDays).map((day) => {
    const date = toDateString(day);
    const count = countsByDate.get(date) ?? 0;
    return {
      date,
      count,
      level: activityLevel(count),
    };
  });

  const activeDates = days.filter((d) => d.count > 0).map((d) => d.date);
  const { current_streak } = computeStreaks(activeDates);

  return {
    days,
    total: days.reduce((sum, d) => sum + d.count, 0),
    active_days: activeDates.length,
    current_streak,
  };
}

export const emptyActivity: ActivitySummary = {
  days: [],
  total: 0,
  active_days: 0,
  current_streak: 0,
};

type TaskRow = Task & {
  projects: {
    id: string;
    title: string;
    goal_id: string;
    goals: { id: string; title: string } | null;
  } | null;
};

export function mapTask(row: TaskRow): TaskWithContext {
  const project = row.projects;
  const goal = project?.goals ?? null;

  let context: string | null = null;
  let context_href: string | null = null;

  if (project && goal) {
    context = `${goal.title} · ${project.title}`;
    context_href = `/goals/${goal.id}/projects/${project.id}`;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    title: row.title,
    completed: row.completed,
    due_date: row.due_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    context,
    context_href,
  };
}

export function buildNextSteps(input: {
  todayTasks: TaskWithContext[];
  nextTasks: TaskWithContext[];
  habits: DashboardHabit[];
  hasReviewToday: boolean;
  focusMinutes: number;
  isNewUser: boolean;
}): NextStep[] {
  const steps: NextStep[] = [];

  if (input.isNewUser) {
    steps.push({
      id: "setup-task",
      kind: "setup",
      title: "Add your first task",
      href: "/tasks",
      detail: "Give today a clear starting point",
    });
    steps.push({
      id: "setup-goal",
      kind: "setup",
      title: "Create a goal",
      href: "/goals",
      detail: "Connect work to something bigger",
    });
    return steps.slice(0, 3);
  }

  for (const habit of input.habits.filter((h) => !h.completed_today).slice(0, 2)) {
    steps.push({
      id: `habit-${habit.id}`,
      kind: "habit",
      title: `Check in: ${habit.title}`,
      href: "/habits",
      detail:
        habit.current_streak > 0
          ? `${habit.current_streak} day streak`
          : "Build the streak",
    });
  }

  for (const task of [...input.todayTasks, ...input.nextTasks].slice(0, 3)) {
    if (steps.some((s) => s.id === `task-${task.id}`)) continue;
    steps.push({
      id: `task-${task.id}`,
      kind: "task",
      title: task.title,
      href: task.context_href ?? "/tasks",
      detail: task.due_date
        ? isOverdue(task.due_date)
          ? "Overdue"
          : "Due today"
        : "Next up",
    });
  }

  if (!input.hasReviewToday) {
    steps.push({
      id: "review",
      kind: "review",
      title: "Write today’s review",
      href: "/review",
      detail: "Close the day with a short reflection",
    });
  }

  if (input.focusMinutes === 0) {
    steps.push({
      id: "focus",
      kind: "focus",
      title: "Start a focus session",
      href: "/focus",
      detail: "Protect time for deep work",
    });
  }

  return steps.slice(0, 4);
}

export function buildDashboardData(
  rows: TaskRow[],
  goalCount: number,
  projectCount: number,
): Pick<
  DashboardData,
  | "stats"
  | "today_tasks"
  | "overdue_tasks"
  | "next_tasks"
  | "week"
  | "goals"
  | "activity"
> {
  const todayStr = toDateString(startOfDay(new Date()));
  const tasks = rows.map(mapTask);

  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const overdue_tasks = active.filter(
    (t) => t.due_date && isOverdue(t.due_date),
  );

  const today_tasks = active.filter(
    (t) => t.due_date && (t.due_date === todayStr || isOverdue(t.due_date)),
  );

  const due_today_only = active.filter((t) => t.due_date === todayStr);

  const next_tasks = active
    .filter((t) => !t.due_date || (!isOverdue(t.due_date) && t.due_date !== todayStr))
    .slice(0, 5);

  const weekStart = startOfDay(new Date());
  const week = getWeekDays(weekStart).map((day) => {
    const dateStr = toDateString(day);
    const task_count = active.filter((t) => t.due_date === dateStr).length;

    return {
      date: dateStr,
      label: formatShortDate(day),
      day_label: formatShortWeekday(day),
      task_count,
      is_today: dateStr === todayStr,
    };
  });

  const goalMap = new Map<
    string,
    { title: string; total: number; completed: number }
  >();

  for (const row of rows) {
    const goal = row.projects?.goals;
    if (!goal) continue;

    const current = goalMap.get(goal.id) ?? {
      title: goal.title,
      total: 0,
      completed: 0,
    };
    current.total += 1;
    if (row.completed) current.completed += 1;
    goalMap.set(goal.id, current);
  }

  const goals: GoalProgress[] = Array.from(goalMap.entries())
    .map(([id, g]) => ({
      id,
      title: g.title,
      task_count: g.total,
      completed_task_count: g.completed,
      progress: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
    }))
    .sort((a, b) => b.task_count - a.task_count)
    .slice(0, 5);

  return {
    stats: {
      active_tasks: active.length,
      completed_tasks: completed.length,
      due_today: due_today_only.length,
      overdue: overdue_tasks.length,
      goals: goalCount,
      projects: projectCount,
      focus_minutes_today: 0,
      habits_done: 0,
      habits_total: 0,
      activity_streak: 0,
    },
    today_tasks: today_tasks.slice(0, 8),
    overdue_tasks: overdue_tasks.slice(0, 5),
    next_tasks,
    week,
    goals,
    activity: emptyActivity,
  };
}
