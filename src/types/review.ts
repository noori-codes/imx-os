export type DailyReview = {
  id: string;
  user_id: string;
  review_date: string;
  went_well: string;
  to_improve: string;
  tomorrow_focus: string;
  mood: number | null;
  energy: number | null;
  created_at: string;
  updated_at: string;
};

export type ReviewTask = {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
};

export type ReviewHabit = {
  id: string;
  title: string;
  color: string;
  completed: boolean;
};

export type ReviewRecap = {
  date: string;
  tasks_due: ReviewTask[];
  tasks_completed: ReviewTask[];
  habits: ReviewHabit[];
  habits_done: number;
  habits_total: number;
  focus_sessions: number;
  focus_minutes: number;
  events_count: number;
  has_journal: boolean;
  journal_id: string | null;
};

export type ReviewPageData = {
  recap: ReviewRecap;
  review: DailyReview | null;
  recent: Pick<DailyReview, "id" | "review_date" | "mood">[];
};
