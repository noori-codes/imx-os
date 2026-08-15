export type AnalyticsDayPoint = {
  date: string;
  label: string;
  tasks_completed: number;
  focus_minutes: number;
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
};

export type AnalyticsData = {
  range_days: number;
  summary: AnalyticsSummary;
  series: AnalyticsDayPoint[];
  habit_streaks: HabitStreakSummary[];
};
