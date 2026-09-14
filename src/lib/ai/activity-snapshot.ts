import { getAnalyticsData } from "@/actions/analytics";
import { createClient } from "@/lib/supabase/server";
import { toDateString } from "@/lib/date-utils";

export type ActivitySnapshot = {
  range_days: 7;
  generated_at: string;
  summary: {
    tasks_completed: number;
    focus_minutes: number;
    focus_sessions: number;
    habits_avg_rate: number;
    reviews_logged: number;
    avg_mood: number | null;
    avg_energy: number | null;
    best_habit_streak: number;
    focus_goal_hit_days: number;
    daily_focus_goal_minutes: number;
  };
  open_tasks_overdue: number;
  open_tasks_due_today: number;
  habit_streaks: {
    title: string;
    current_streak: number;
    completion_rate: number;
  }[];
  quiet_days: number;
  strong_focus_days: number;
};

/** Compact last-7-days context for the weekly insight prompt. */
export async function buildActivitySnapshot(
  userId: string,
): Promise<ActivitySnapshot> {
  const analytics = await getAnalyticsData(7);
  const today = toDateString(new Date());
  const supabase = await createClient();

  const { count: overdueCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", false)
    .not("due_date", "is", null)
    .lt("due_date", today);

  const { count: dueTodayCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", false)
    .eq("due_date", today);

  const quiet_days = analytics.series.filter(
    (day) =>
      day.focus_minutes === 0 &&
      day.tasks_completed === 0 &&
      day.habits_done === 0,
  ).length;

  const strong_focus_days = analytics.series.filter(
    (day) => day.focus_minutes >= analytics.summary.daily_focus_goal_minutes,
  ).length;

  return {
    range_days: 7,
    generated_at: new Date().toISOString(),
    summary: {
      tasks_completed: analytics.summary.tasks_completed,
      focus_minutes: analytics.summary.focus_minutes,
      focus_sessions: analytics.summary.focus_sessions,
      habits_avg_rate: analytics.summary.habits_avg_rate,
      reviews_logged: analytics.summary.reviews_logged,
      avg_mood: analytics.summary.avg_mood,
      avg_energy: analytics.summary.avg_energy,
      best_habit_streak: analytics.summary.best_habit_streak,
      focus_goal_hit_days: analytics.summary.focus_goal_hit_days,
      daily_focus_goal_minutes: analytics.summary.daily_focus_goal_minutes,
    },
    open_tasks_overdue: overdueCount ?? 0,
    open_tasks_due_today: dueTodayCount ?? 0,
    habit_streaks: analytics.habit_streaks.slice(0, 8).map((habit) => ({
      title: habit.title,
      current_streak: habit.current_streak,
      completion_rate: habit.completion_rate,
    })),
    quiet_days,
    strong_focus_days,
  };
}

export function snapshotToPromptText(snapshot: ActivitySnapshot): string {
  const { summary } = snapshot;
  const habitLines =
    snapshot.habit_streaks.length > 0
      ? snapshot.habit_streaks
          .map(
            (habit) =>
              `- ${habit.title}: streak ${habit.current_streak}d, ${habit.completion_rate}% of days`,
          )
          .join("\n")
      : "- No habits logged";

  const mood =
    summary.avg_mood != null ? `avg mood ${summary.avg_mood}/5` : "mood n/a";
  const energy =
    summary.avg_energy != null
      ? `avg energy ${summary.avg_energy}/5`
      : "energy n/a";

  return [
    `Last ${snapshot.range_days} days:`,
    `Focus: ${summary.focus_minutes} minutes across ${summary.focus_sessions} sessions; hit daily goal on ${summary.focus_goal_hit_days}/${snapshot.range_days} days (goal ${summary.daily_focus_goal_minutes}m). Strong focus days: ${snapshot.strong_focus_days}. Quiet days: ${snapshot.quiet_days}.`,
    `Tasks: ${summary.tasks_completed} completed; ${snapshot.open_tasks_overdue} overdue open; ${snapshot.open_tasks_due_today} due today.`,
    `Habits: average completion ${summary.habits_avg_rate}%; best streak ${summary.best_habit_streak}d.`,
    habitLines,
    `Reviews: ${summary.reviews_logged} logged (${mood}, ${energy}).`,
  ].join("\n");
}

