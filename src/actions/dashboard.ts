"use server";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery } from "@/lib/cache";
import {
  computeStreaks,
  toDateString,
} from "@/lib/date-utils";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildActivitySummary,
  buildDashboardData,
  emptyActivity,
  type ActivitySummary,
  type DashboardData,
  type DashboardHabit,
} from "@/types/dashboard";

const ACTIVITY_RANGE_DAYS = 365;

const emptyDashboard: DashboardData = {
  stats: {
    active_tasks: 0,
    completed_tasks: 0,
    due_today: 0,
    overdue: 0,
    goals: 0,
    projects: 0,
    focus_minutes_today: 0,
    habits_done: 0,
    habits_total: 0,
    activity_streak: 0,
  },
  today_tasks: [],
  overdue_tasks: [],
  next_tasks: [],
  week: [],
  goals: [],
  activity: emptyActivity,
  habits_today: [],
  focus_today: { sessions: 0, focus_minutes: 0 },
  review: { has_today: false, intent: null },
  is_new_user: true,
};

async function loadActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
): Promise<ActivitySummary> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (ACTIVITY_RANGE_DAYS - 1));
  start.setHours(0, 0, 0, 0);

  const rangeStart = toDateString(start);
  const rangeStartIso = start.toISOString();
  const rangeEndExclusive = new Date(end);
  rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);
  rangeEndExclusive.setHours(0, 0, 0, 0);
  const rangeEndIso = rangeEndExclusive.toISOString();

  let tasksQuery = supabase
    .from("tasks")
    .select("updated_at")
    .eq("completed", true)
    .gte("updated_at", rangeStartIso)
    .lt("updated_at", rangeEndIso);

  let habitLogsQuery = supabase
    .from("habit_logs")
    .select("logged_on")
    .gte("logged_on", rangeStart)
    .lte("logged_on", toDateString(end));

  let focusQuery = supabase
    .from("focus_sessions")
    .select("started_at")
    .eq("mode", "focus")
    .gte("started_at", rangeStartIso)
    .lt("started_at", rangeEndIso);

  if (userId) {
    tasksQuery = tasksQuery.eq("user_id", userId);
    habitLogsQuery = habitLogsQuery.eq("user_id", userId);
    focusQuery = focusQuery.eq("user_id", userId);
  }

  const [tasksResult, habitsResult, focusResult] = await Promise.all([
    tasksQuery,
    habitLogsQuery,
    focusQuery,
  ]);

  const counts = new Map<string, number>();

  for (const task of tasksResult.data ?? []) {
    const date = toDateString(new Date(task.updated_at));
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  for (const log of habitsResult.data ?? []) {
    counts.set(log.logged_on, (counts.get(log.logged_on) ?? 0) + 1);
  }

  for (const session of focusResult.data ?? []) {
    const date = toDateString(new Date(session.started_at));
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return buildActivitySummary(counts, ACTIVITY_RANGE_DAYS);
}

async function loadDashboardExtras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
) {
  const today = toDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateString(yesterday);

  const focusStart = new Date();
  focusStart.setHours(0, 0, 0, 0);

  let habitsQuery = supabase
    .from("habits")
    .select("id, title, color")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  let habitLogsQuery = supabase
    .from("habit_logs")
    .select("habit_id, logged_on")
    .gte("logged_on", toDateString(new Date(Date.now() - 90 * 86400000)));

  let focusQuery = supabase
    .from("focus_sessions")
    .select("actual_seconds")
    .eq("mode", "focus")
    .gte("started_at", focusStart.toISOString());

  let todayReviewQuery = supabase
    .from("daily_reviews")
    .select("id")
    .eq("review_date", today);

  let intentReviewQuery = supabase
    .from("daily_reviews")
    .select("tomorrow_focus, review_date")
    .eq("review_date", yesterdayStr);

  if (userId) {
    habitsQuery = habitsQuery.eq("user_id", userId);
    habitLogsQuery = habitLogsQuery.eq("user_id", userId);
    focusQuery = focusQuery.eq("user_id", userId);
    todayReviewQuery = todayReviewQuery.eq("user_id", userId);
    intentReviewQuery = intentReviewQuery.eq("user_id", userId);
  }

  const [habitsResult, logsResult, focusResult, todayReview, intentReview] =
    await Promise.all([
      habitsQuery,
      habitLogsQuery,
      focusQuery,
      todayReviewQuery.maybeSingle(),
      intentReviewQuery.maybeSingle(),
    ]);

  const logsByHabit = new Map<string, string[]>();
  for (const log of logsResult.data ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.logged_on);
    logsByHabit.set(log.habit_id, list);
  }

  const habits_today: DashboardHabit[] = (habitsResult.data ?? []).map(
    (habit) => {
      const dates = logsByHabit.get(habit.id) ?? [];
      const { current_streak, longest_streak } = computeStreaks(dates, today);
      return {
        id: habit.id,
        title: habit.title,
        color: habit.color,
        completed_today: dates.includes(today),
        current_streak,
        longest_streak,
      };
    },
  );

  const focus_minutes = Math.round(
    (focusResult.data ?? []).reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
  );

  const intent =
    intentReview.data?.tomorrow_focus?.trim() ||
    null;

  return {
    habits_today,
    focus_today: {
      sessions: focusResult.data?.length ?? 0,
      focus_minutes,
    },
    review: {
      has_today: Boolean(todayReview.data?.id),
      intent,
    },
  };
}

async function loadDashboardData(
  userId: string | null,
): Promise<DashboardData> {
  const supabase =
    userId && hasAdminClient() ? createAdminClient() : await createClient();
  const scopedUserId = userId && hasAdminClient() ? userId : null;

  let tasksQuery = supabase
    .from("tasks")
    .select(
      `
      *,
      projects (
        id,
        title,
        goal_id,
        goals ( id, title )
      )
    `,
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  let goalsQuery = supabase
    .from("goals")
    .select("id", { count: "exact", head: true });

  let projectsQuery = supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  if (scopedUserId) {
    tasksQuery = tasksQuery.eq("user_id", scopedUserId);
    goalsQuery = goalsQuery.eq("user_id", scopedUserId);
    projectsQuery = projectsQuery.eq("user_id", scopedUserId);
  }

  const [tasksResult, goalsResult, projectsResult, activity, extras] =
    await Promise.all([
      tasksQuery,
      goalsQuery,
      projectsQuery,
      loadActivity(supabase, scopedUserId),
      loadDashboardExtras(supabase, scopedUserId),
    ]);

  if (tasksResult.error) {
    console.error("[dashboard] getDashboardData:", tasksResult.error.message);
  }

  const base = buildDashboardData(
    tasksResult.data ?? [],
    goalsResult.count ?? 0,
    projectsResult.count ?? 0,
  );

  const is_new_user =
    base.stats.active_tasks === 0 &&
    base.stats.goals === 0 &&
    extras.habits_today.length === 0;

  const habits_done = extras.habits_today.filter((h) => h.completed_today)
    .length;

  return {
    ...base,
    activity,
    habits_today: extras.habits_today,
    focus_today: extras.focus_today,
    review: extras.review,
    is_new_user,
    stats: {
      ...base.stats,
      focus_minutes_today: extras.focus_today.focus_minutes,
      habits_done,
      habits_total: extras.habits_today.length,
      activity_streak: activity.current_streak,
    },
  };
}

/** Dashboard aggregates — request cache + optional cross-request cache. */
export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const user = await getCurrentUser();
  if (!user) {
    return emptyDashboard;
  }

  if (hasAdminClient()) {
    return cachedQuery(
      ["dashboard", user.id, "v4"],
      [cacheTags.dashboard(user.id)],
      CACHE_TTL.dashboard,
      async () => loadDashboardData(user.id),
    )();
  }

  return loadDashboardData(null);
});
