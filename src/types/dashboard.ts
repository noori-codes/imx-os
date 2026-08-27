import {
  computeStreaks,
  formatShortDate,
  formatShortWeekday,
  getPastDays,
  getWeekDays,
  isOverdue,
  startOfDay,
  startOfWeekSaturday,
  toDateString,
} from "@/lib/date-utils";
import type { Task, TaskWithContext } from "@/types/task";

export type { TaskWithContext };

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
    recurrence: row.recurrence ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    context,
    context_href,
  };
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

  const open_today = active.filter(
    (t) => t.due_date && (t.due_date === todayStr || isOverdue(t.due_date)),
  );
  const done_today = completed.filter(
    (t) => t.due_date === todayStr,
  );
  // Habit-like: keep finished-today items visible with open ones first
  const today_tasks = [
    ...open_today,
    ...done_today.sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
  ];

  const due_today_only = active.filter((t) => t.due_date === todayStr);

  const next_tasks = active
    .filter((t) => !t.due_date || (!isOverdue(t.due_date) && t.due_date !== todayStr))
    .slice(0, 5);

  const weekStart = startOfWeekSaturday(new Date());
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
    goals: [],
    activity: emptyActivity,
  };
}

/** Same progress math as the Goals page: completed tasks / all project tasks. */
export function buildGoalProgressList(
  goals: { id: string; title: string }[],
  projects: { id: string; goal_id: string }[],
  tasks: { project_id: string | null; completed: boolean }[],
): GoalProgress[] {
  const projectIdsByGoal = new Map<string, string[]>();
  for (const project of projects) {
    const list = projectIdsByGoal.get(project.goal_id) ?? [];
    list.push(project.id);
    projectIdsByGoal.set(project.goal_id, list);
  }

  const taskStatsByProject = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const task of tasks) {
    if (!task.project_id) continue;
    const current = taskStatsByProject.get(task.project_id) ?? {
      total: 0,
      completed: 0,
    };
    current.total += 1;
    if (task.completed) current.completed += 1;
    taskStatsByProject.set(task.project_id, current);
  }

  return goals
    .map((goal) => {
      const goalProjectIds = projectIdsByGoal.get(goal.id) ?? [];
      let task_count = 0;
      let completed_task_count = 0;
      for (const pid of goalProjectIds) {
        const stats = taskStatsByProject.get(pid);
        if (!stats) continue;
        task_count += stats.total;
        completed_task_count += stats.completed;
      }

      return {
        id: goal.id,
        title: goal.title,
        task_count,
        completed_task_count,
        progress:
          task_count > 0
            ? Math.round((completed_task_count / task_count) * 100)
            : 0,
      };
    })
    .sort((a, b) => {
      if (b.task_count !== a.task_count) return b.task_count - a.task_count;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 5);
}
