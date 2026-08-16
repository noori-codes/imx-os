export type Habit = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  logged_on: string;
  created_at: string;
};

export type HabitWithStats = Habit & {
  completed_today: boolean;
  current_streak: number;
  longest_streak: number;
  week: { date: string; completed: boolean }[];
};

export type HabitView = "active" | "archived";

export const HABIT_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#06b6d4", label: "Cyan" },
] as const;
