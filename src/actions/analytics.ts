"use server";

import {
  computeStreaks,
  formatShortDate,
  getPastDays,
  toDateString,
} from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsData,
  AnalyticsDayPoint,
  HabitStreakSummary,
} from "@/types/analytics";

const RANGE_DAYS = 30;

export async function getAnalyticsData(
  rangeDays = RANGE_DAYS,
): Promise<AnalyticsData> {
  const supabase = await createClient();
  const days = getPastDays(rangeDays);
  const rangeStart = toDateString(days[0]);
  const rangeEnd = toDateString(days[days.length - 1]);
  const rangeStartIso = days[0].toISOString();
  const rangeEndExclusive = new Date(days[days.length - 1]);
  rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);
  const rangeEndIso = rangeEndExclusive.toISOString();

  const [
    completedTasksResult,
    focusResult,
    habitsResult,
    habitLogsResult,
    reviewsResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, updated_at")
      .eq("completed", true)
      .gte("updated_at", rangeStartIso)
      .lt("updated_at", rangeEndIso),
    supabase
      .from("focus_sessions")
      .select("actual_seconds, started_at")
      .eq("mode", "focus")
      .gte("started_at", rangeStartIso)
      .lt("started_at", rangeEndIso),
    supabase
      .from("habits")
      .select("id, title, color")
      .eq("archived", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, logged_on")
      .gte("logged_on", rangeStart)
      .lte("logged_on", rangeEnd),
    supabase
      .from("daily_reviews")
      .select("review_date, mood, energy")
      .gte("review_date", rangeStart)
      .lte("review_date", rangeEnd)
      .order("review_date", { ascending: true }),
  ]);

  if (completedTasksResult.error) {
    console.error("[analytics] tasks:", completedTasksResult.error.message);
  }
  if (focusResult.error) {
    console.error("[analytics] focus:", focusResult.error.message);
  }
  if (habitsResult.error) {
    console.error("[analytics] habits:", habitsResult.error.message);
  }
  if (habitLogsResult.error) {
    console.error("[analytics] habit logs:", habitLogsResult.error.message);
  }
  if (reviewsResult.error) {
    console.error("[analytics] reviews:", reviewsResult.error.message);
  }

  const tasksByDay = new Map<string, number>();
  for (const task of completedTasksResult.data ?? []) {
    const date = toDateString(new Date(task.updated_at));
    tasksByDay.set(date, (tasksByDay.get(date) ?? 0) + 1);
  }

  const focusByDay = new Map<string, number>();
  for (const session of focusResult.data ?? []) {
    const date = toDateString(new Date(session.started_at));
    const minutes = Math.round(session.actual_seconds / 60);
    focusByDay.set(date, (focusByDay.get(date) ?? 0) + minutes);
  }

  const habits = habitsResult.data ?? [];
  const habitCount = habits.length;
  const habitsDoneByDay = new Map<string, number>();
  const logsByHabit = new Map<string, string[]>();

  for (const log of habitLogsResult.data ?? []) {
    habitsDoneByDay.set(
      log.logged_on,
      (habitsDoneByDay.get(log.logged_on) ?? 0) + 1,
    );
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.logged_on);
    logsByHabit.set(log.habit_id, list);
  }

  const reviewByDay = new Map<
    string,
    { mood: number | null; energy: number | null }
  >();
  for (const review of reviewsResult.data ?? []) {
    reviewByDay.set(review.review_date, {
      mood: review.mood,
      energy: review.energy,
    });
  }

  const today = toDateString(new Date());
  const series: AnalyticsDayPoint[] = days.map((day) => {
    const date = toDateString(day);
    const review = reviewByDay.get(date);

    return {
      date,
      label: formatShortDate(day),
      tasks_completed: tasksByDay.get(date) ?? 0,
      focus_minutes: focusByDay.get(date) ?? 0,
      habits_done: habitsDoneByDay.get(date) ?? 0,
      habits_total: habitCount,
      mood: review?.mood ?? null,
      energy: review?.energy ?? null,
    };
  });

  // Longer lookback for accurate streaks
  const streakLookback = new Date();
  streakLookback.setDate(streakLookback.getDate() - 120);
  const streakLookbackStr = toDateString(streakLookback);

  let streakLogs: { habit_id: string; logged_on: string }[] =
    habitLogsResult.data ?? [];

  if (habits.length > 0) {
    const { data: longLogs, error: longError } = await supabase
      .from("habit_logs")
      .select("habit_id, logged_on")
      .in(
        "habit_id",
        habits.map((h) => h.id),
      )
      .gte("logged_on", streakLookbackStr)
      .order("logged_on", { ascending: true });

    if (longError) {
      console.error("[analytics] streak logs:", longError.message);
    } else {
      streakLogs = longLogs ?? [];
    }
  }

  const streakDatesByHabit = new Map<string, string[]>();
  for (const log of streakLogs) {
    const list = streakDatesByHabit.get(log.habit_id) ?? [];
    list.push(log.logged_on);
    streakDatesByHabit.set(log.habit_id, list);
  }

  const habit_streaks: HabitStreakSummary[] = habits.map((habit) => {
    const allDates = streakDatesByHabit.get(habit.id) ?? [];
    const rangeDates = logsByHabit.get(habit.id) ?? [];
    const { current_streak, longest_streak } = computeStreaks(allDates, today);
    const days_logged = new Set(rangeDates).size;
    const completion_rate =
      rangeDays > 0 ? Math.round((days_logged / rangeDays) * 100) : 0;

    return {
      id: habit.id,
      title: habit.title,
      color: habit.color,
      current_streak,
      longest_streak,
      completion_rate,
      days_logged,
    };
  }).sort((a, b) => b.current_streak - a.current_streak || b.longest_streak - a.longest_streak);

  const tasks_completed = series.reduce((sum, d) => sum + d.tasks_completed, 0);
  const focus_minutes = series.reduce((sum, d) => sum + d.focus_minutes, 0);
  const focus_sessions = focusResult.data?.length ?? 0;
  const reviews_logged = reviewsResult.data?.length ?? 0;

  const moodValues = series
    .map((d) => d.mood)
    .filter((v): v is number => v !== null);
  const energyValues = series
    .map((d) => d.energy)
    .filter((v): v is number => v !== null);

  const habitRates = habit_streaks.map((h) => h.completion_rate);
  const habits_avg_rate =
    habitRates.length > 0
      ? Math.round(
          habitRates.reduce((sum, rate) => sum + rate, 0) / habitRates.length,
        )
      : 0;

  return {
    range_days: rangeDays,
    summary: {
      tasks_completed,
      focus_minutes,
      focus_sessions,
      habits_avg_rate,
      reviews_logged,
      avg_mood:
        moodValues.length > 0
          ? Math.round(
              (moodValues.reduce((sum, v) => sum + v, 0) / moodValues.length) *
                10,
            ) / 10
          : null,
      avg_energy:
        energyValues.length > 0
          ? Math.round(
              (energyValues.reduce((sum, v) => sum + v, 0) /
                energyValues.length) *
                10,
            ) / 10
          : null,
      best_habit_streak: habit_streaks.reduce(
        (max, h) => Math.max(max, h.longest_streak),
        0,
      ),
    },
    series,
    habit_streaks,
  };
}
