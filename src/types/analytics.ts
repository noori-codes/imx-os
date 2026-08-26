export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRangeDays = (typeof ANALYTICS_RANGES)[number];

export function parseAnalyticsRange(
  raw: string | string[] | undefined | null,
): AnalyticsRangeDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (n === 7 || n === 30 || n === 90) return n;
  return 30;
}

export type AnalyticsDayPoint = {
  date: string;
  label: string;
  tasks_completed: number;
  focus_minutes: number;
  focus_goal_minutes: number;
  habits_done: number;
  habits_total: number;
  mood: number | null;
  energy: number | null;
};

export type HabitStreakSummary = {
  id: string;
  title: string;
  color: string;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  days_logged: number;
};

export type AnalyticsSummary = {
  tasks_completed: number;
  focus_minutes: number;
  focus_sessions: number;
  habits_avg_rate: number;
  reviews_logged: number;
  avg_mood: number | null;
  avg_energy: number | null;
  best_habit_streak: number;
  /** Days in range where focus_minutes >= daily goal. */
  focus_goal_hit_days: number;
  /** Days considered for goal rate (same as range_days). */
  focus_goal_days: number;
  daily_focus_goal_minutes: number;
};

export type AnalyticsData = {
  range_days: AnalyticsRangeDays;
  summary: AnalyticsSummary;
  series: AnalyticsDayPoint[];
  habit_streaks: HabitStreakSummary[];
};
