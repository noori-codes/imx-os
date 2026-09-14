"use server";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery } from "@/lib/cache";
import {
  computeStreaks,
  formatShortDate,
  formatShortWeekday,
  getWeekDays,
  startOfDay,
  startOfWeekSaturday,
  toDateString,
} from "@/lib/date-utils";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { scheduleRecurringTaskSync } from "@/actions/tasks";
import {
  buildActivitySummary,
  buildGoalProgressList,
  emptyActivity,
  mapTask,
  type ActivitySummary,
  type DashboardData,
  type DashboardHabit,
} from "@/types/dashboard";

/** Enough for streak + week insight; analytics keeps the long window. */
const ACTIVITY_RANGE_DAYS = 90;

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
    focusQuery = focusQuery.eq("user_id", userId);
    todayReviewQuery = todayReviewQuery.eq("user_id", userId);
    intentReviewQuery = intentReviewQuery.eq("user_id", userId);
  }

  const [habitsResult, focusResult, todayReview, intentReview] =
    await Promise.all([
      habitsQuery,
      focusQuery,
      todayReviewQuery.maybeSingle(),
      intentReviewQuery.maybeSingle(),
    ]);

  const habits = habitsResult.data ?? [];
  const habitIds = habits.map((habit) => habit.id);

  let habitLogsQuery = supabase
    .from("habit_logs")
    .select("habit_id, logged_on")
    .gte("logged_on", toDateString(new Date(Date.now() - 90 * 86400000)));

  if (userId) {
    habitLogsQuery = habitLogsQuery.eq("user_id", userId);
  }
  if (habitIds.length > 0) {
    habitLogsQuery = habitLogsQuery.in("habit_id", habitIds);
  }

  const logsResult =
    habitIds.length > 0
      ? await habitLogsQuery
      : { data: [] as { habit_id: string; logged_on: string }[], error: null };

  const logsByHabit = new Map<string, string[]>();
  for (const log of logsResult.data ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.logged_on);
    logsByHabit.set(log.habit_id, list);
  }

  const habits_today: DashboardHabit[] = habits.map((habit) => {
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
  });

  const focus_minutes = Math.round(
    (focusResult.data ?? []).reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
  );

  const intent = intentReview.data?.tomorrow_focus?.trim() || null;

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

const DASH_TASK_SELECT = `
  id,
  user_id,
  project_id,
  title,
  completed,
  due_date,
  recurrence,
  created_at,
  updated_at,
  projects (
    id,
    title,
    goal_id,
    goals ( id, title )
  )
`;

async function loadDashboardData(
  userId: string | null,
): Promise<DashboardData> {
  const supabase =
    userId && hasAdminClient() ? createAdminClient() : await createClient();
  const scopedUserId = userId && hasAdminClient() ? userId : null;

  // Cookie-bound client for after() sync (cookies aren't available inside after).
  scheduleRecurringTaskSync(await createClient());

  const todayStr = toDateString(startOfDay(new Date()));
  const weekStart = startOfWeekSaturday(new Date());
  const weekDays = getWeekDays(weekStart);
  const weekStartStr = toDateString(weekDays[0]!);
  const weekEndStr = toDateString(weekDays[6]!);

  let goalsQuery = supabase
    .from("goals")
    .select("id, title")
    .order("created_at", { ascending: false });
  let projectsQuery = supabase.from("projects").select("id, goal_id");
  let projectTasksQuery = supabase
    .from("tasks")
    .select("project_id, completed")
    .not("project_id", "is", null);

  let activeCountQ = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("completed", false);
  let completedCountQ = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("completed", true);
  let dueTodayCountQ = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("completed", false)
    .eq("due_date", todayStr);
  let overdueCountQ = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("completed", false)
    .lt("due_date", todayStr)
    .not("due_date", "is", null);

  let todayOpenQ = supabase
    .from("tasks")
    .select(DASH_TASK_SELECT)
    .eq("completed", false)
    .not("due_date", "is", null)
    .lte("due_date", todayStr)
    .order("due_date", { ascending: true })
    .limit(8);
  let todayDoneQ = supabase
    .from("tasks")
    .select(DASH_TASK_SELECT)
    .eq("completed", true)
    .eq("due_date", todayStr)
    .order("updated_at", { ascending: false })
    .limit(8);
  let overdueListQ = supabase
    .from("tasks")
    .select(DASH_TASK_SELECT)
    .eq("completed", false)
    .lt("due_date", todayStr)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true })
    .limit(5);
  let nextTasksQ = supabase
    .from("tasks")
    .select(DASH_TASK_SELECT)
    .eq("completed", false)
    .or(`due_date.is.null,due_date.gt.${todayStr}`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(5);
  let weekOpenQ = supabase
    .from("tasks")
    .select("due_date")
    .eq("completed", false)
    .not("due_date", "is", null)
    .gte("due_date", weekStartStr)
    .lte("due_date", weekEndStr);

  if (scopedUserId) {
    goalsQuery = goalsQuery.eq("user_id", scopedUserId);
    projectsQuery = projectsQuery.eq("user_id", scopedUserId);
    projectTasksQuery = projectTasksQuery.eq("user_id", scopedUserId);
    activeCountQ = activeCountQ.eq("user_id", scopedUserId);
    completedCountQ = completedCountQ.eq("user_id", scopedUserId);
    dueTodayCountQ = dueTodayCountQ.eq("user_id", scopedUserId);
    overdueCountQ = overdueCountQ.eq("user_id", scopedUserId);
    todayOpenQ = todayOpenQ.eq("user_id", scopedUserId);
    todayDoneQ = todayDoneQ.eq("user_id", scopedUserId);
    overdueListQ = overdueListQ.eq("user_id", scopedUserId);
    nextTasksQ = nextTasksQ.eq("user_id", scopedUserId);
    weekOpenQ = weekOpenQ.eq("user_id", scopedUserId);
  }

  const [
    goalsResult,
    projectsResult,
    projectTasksResult,
    activeCount,
    completedCount,
    dueTodayCount,
    overdueCount,
    todayOpenResult,
    todayDoneResult,
    overdueListResult,
    nextTasksResult,
    weekOpenResult,
    activity,
    extras,
  ] = await Promise.all([
    goalsQuery,
    projectsQuery,
    projectTasksQuery,
    activeCountQ,
    completedCountQ,
    dueTodayCountQ,
    overdueCountQ,
    todayOpenQ,
    todayDoneQ,
    overdueListQ,
    nextTasksQ,
    weekOpenQ,
    loadActivity(supabase, scopedUserId),
    loadDashboardExtras(supabase, scopedUserId),
  ]);

  if (goalsResult.error) {
    console.error("[dashboard] goals:", goalsResult.error.message);
  }
  if (projectsResult.error) {
    console.error("[dashboard] projects:", projectsResult.error.message);
  }
  if (projectTasksResult.error) {
    console.error("[dashboard] project tasks:", projectTasksResult.error.message);
  }

  type DashTaskRow = Parameters<typeof mapTask>[0];
  const mapRows = (rows: unknown) =>
    ((rows ?? []) as DashTaskRow[]).map(mapTask);

  const today_tasks = [
    ...mapRows(todayOpenResult.data),
    ...mapRows(todayDoneResult.data),
  ].slice(0, 8);

  const weekCounts = new Map<string, number>();
  for (const row of weekOpenResult.data ?? []) {
    if (!row.due_date) continue;
    weekCounts.set(row.due_date, (weekCounts.get(row.due_date) ?? 0) + 1);
  }

  const week = weekDays.map((day) => {
    const dateStr = toDateString(day);
    return {
      date: dateStr,
      label: formatShortDate(day),
      day_label: formatShortWeekday(day),
      task_count: weekCounts.get(dateStr) ?? 0,
      is_today: dateStr === todayStr,
    };
  });

  const goals = buildGoalProgressList(
    goalsResult.data ?? [],
    projectsResult.data ?? [],
    projectTasksResult.data ?? [],
  );

  const habits_done = extras.habits_today.filter((h) => h.completed_today)
    .length;

  return {
    stats: {
      active_tasks: activeCount.count ?? 0,
      completed_tasks: completedCount.count ?? 0,
      due_today: dueTodayCount.count ?? 0,
      overdue: overdueCount.count ?? 0,
      goals: (goalsResult.data ?? []).length,
      projects: (projectsResult.data ?? []).length,
      focus_minutes_today: extras.focus_today.focus_minutes,
      habits_done,
      habits_total: extras.habits_today.length,
      activity_streak: activity.current_streak,
    },
    today_tasks,
    overdue_tasks: mapRows(overdueListResult.data),
    next_tasks: mapRows(nextTasksResult.data),
    week,
    goals,
    activity,
    habits_today: extras.habits_today,
    focus_today: extras.focus_today,
    review: extras.review,
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
      ["dashboard", user.id, "v10"],
      [cacheTags.dashboard(user.id)],
      CACHE_TTL.dashboard,
      async () => loadDashboardData(user.id),
    )();
  }

  return loadDashboardData(null);
});
