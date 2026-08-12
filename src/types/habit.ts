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
