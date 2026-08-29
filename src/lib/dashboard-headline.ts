import type { GoalProgress, WeekDaySummary } from "@/types/dashboard";

export type DashboardQuadId = "tasks" | "habits" | "week" | "goals";

type PickHeadlineQuadInput = {
  overdue: number;
  dueToday: number;
  openTaskCount: number;
  taskCount: number;
  habitsDone: number;
  habitsTotal: number;
  focusMinutes: number;
  week: WeekDaySummary[];
  goals: GoalProgress[];
};

export function pickHeadlineQuad({
  overdue,
  dueToday,
  openTaskCount,
  taskCount,
  habitsDone,
  habitsTotal,
  focusMinutes,
  week,
  goals,
}: PickHeadlineQuadInput): DashboardQuadId | null {
  const tasksClear = taskCount > 0 && openTaskCount === 0;
  const habitsPending = habitsTotal > 0 && habitsDone < habitsTotal;
  const habitsRemaining = Math.max(0, habitsTotal - habitsDone);

  const todayLoad = week.find((day) => day.is_today)?.task_count ?? 0;
  const peakWeekLoad = Math.max(...week.map((day) => day.task_count), 0);
  const weekTotal = week.reduce((sum, day) => sum + day.task_count, 0);

  const goalsWithTasks = goals.filter((goal) => goal.task_count > 0);
  const leadingGoal = [...goalsWithTasks].sort(
    (a, b) => b.progress - a.progress,
  )[0];

  const scores: { id: DashboardQuadId; score: number }[] = [];

  if (overdue > 0) {
    scores.push({ id: "tasks", score: 120 + overdue * 12 });
  } else if (dueToday > 0) {
    scores.push({ id: "tasks", score: 88 + dueToday * 6 });
  } else if (openTaskCount > 0) {
    scores.push({ id: "tasks", score: 52 + openTaskCount * 2 });
  }

  if (tasksClear && habitsPending) {
    scores.push({ id: "habits", score: 92 });
  } else if (habitsPending && habitsRemaining <= 2) {
    scores.push({ id: "habits", score: 78 + (2 - habitsRemaining) * 8 });
  } else if (habitsPending) {
    scores.push({ id: "habits", score: 48 + habitsDone });
  }

  if (
    weekTotal > 0 &&
    todayLoad > 0 &&
    todayLoad >= peakWeekLoad &&
    todayLoad >= 2
  ) {
    scores.push({ id: "week", score: 64 + todayLoad * 4 });
  } else if (weekTotal >= 6) {
    scores.push({ id: "week", score: 40 + Math.min(weekTotal, 12) });
  }

  if (
    leadingGoal &&
    leadingGoal.progress >= 80 &&
    leadingGoal.progress < 100
  ) {
    scores.push({ id: "goals", score: 58 + leadingGoal.progress / 4 });
  } else if (leadingGoal && leadingGoal.progress >= 100) {
    scores.push({ id: "goals", score: 44 });
  }

  if (
    scores.length === 0 &&
    focusMinutes >= 60 &&
    overdue === 0 &&
    dueToday === 0 &&
    tasksClear
  ) {
    return null;
  }

  if (scores.length === 0) return null;

  return scores.sort((a, b) => b.score - a.score)[0]?.id ?? null;
}
