import {
  formatShortDate,
  formatShortWeekday,
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

export type DashboardData = {
  stats: DashboardStats;
  today_tasks: TaskWithContext[];
  overdue_tasks: TaskWithContext[];
  week: WeekDaySummary[];
  goals: GoalProgress[];
};

type TaskRow = Task & {
  projects: {
    id: string;
    title: string;
    goal_id: string;
    goals: { id: string; title: string } | null;
  } | null;
};

function mapTask(row: TaskRow): TaskWithContext {
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

export function buildDashboardData(
  rows: TaskRow[],
  goalCount: number,
  projectCount: number,
): DashboardData {
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
    },
    today_tasks: today_tasks.slice(0, 8),
    overdue_tasks: overdue_tasks.slice(0, 5),
    week,
    goals,
  };
}
