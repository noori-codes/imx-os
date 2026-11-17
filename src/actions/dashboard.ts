"use server";

import { cache } from "react";

import { resolveUserForData } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery } from "@/lib/cache";
import {
  addDaysToDateString,
  computeStreaks,
  startOfWeekDateString,
  toDateString,
} from "@/lib/date-utils";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { scheduleRecurringTaskSync } from "@/actions/tasks";
import {
  getRequestTimeZone,
  getTodayString,
  toDateStringInZone,
  zonedDayBounds,
} from "@/lib/timezone";
import {
  buildActivitySummary,
  buildGoalProgressList,
  emptyActivity,
  mapTask,
  type ActivitySummary,
  type DashboardData,
  type DashboardHabit,
} from "@/types/dashboard";
import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
} from "@/types/focus";
import { DEFAULT_USER_SETTINGS } from "@/types/settings";

/**
 * Heatmap display window only — underlying habit/focus/task rows are kept
 * forever; streaks use the full shared habit_logs fetch below.
 */
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
  reading_book: null,
  daily_focus_goal_minutes: FOCUS_DAILY_GOAL_DEFAULT,
  streak_freezes_remaining: DEFAULT_USER_SETTINGS.streak_freezes_remaining,
};

type HabitLogRow = { habit_id: string; logged_on: string };

/**
 * Activity from tasks + focus. Habit-log day counts are merged in by the
 * caller from the shared 90-day habit_logs fetch (avoids a duplicate query).
 */
async function loadActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
  todayStr: string,
  timeZone: string | null,
  habitLogDates: string[],
): Promise<ActivitySummary> {
  const rangeStartStr = addDaysToDateString(todayStr, -(ACTIVITY_RANGE_DAYS - 1));
  const rangeEndExclusiveStr = addDaysToDateString(todayStr, 1);

  let rangeStartIso: string;
  let rangeEndIso: string;
  if (timeZone) {
    rangeStartIso = zonedDayBounds(rangeStartStr, timeZone).start.toISOString();
    rangeEndIso = zonedDayBounds(todayStr, timeZone).end.toISOString();
  } else {
    rangeStartIso = `${rangeStartStr}T00:00:00.000Z`;
    rangeEndIso = `${rangeEndExclusiveStr}T00:00:00.000Z`;
  }

  let tasksQuery = supabase
    .from("tasks")
    .select("updated_at")
    .eq("completed", true)
    .gte("updated_at", rangeStartIso)
    .lt("updated_at", rangeEndIso);

  let focusQuery = supabase
    .from("focus_sessions")
    .select("started_at")
    .eq("mode", "focus")
    .gte("started_at", rangeStartIso)
    .lt("started_at", rangeEndIso);

  if (userId) {
    tasksQuery = tasksQuery.eq("user_id", userId);
    focusQuery = focusQuery.eq("user_id", userId);
  }

  const [tasksResult, focusResult] = await Promise.all([
    tasksQuery,
    focusQuery,
  ]);

  const counts = new Map<string, number>();
  const bucket = (iso: string) =>
    timeZone
      ? toDateStringInZone(new Date(iso), timeZone)
      : toDateString(new Date(iso));

  for (const task of tasksResult.data ?? []) {
    const date = bucket(task.updated_at);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  for (const loggedOn of habitLogDates) {
    if (loggedOn < rangeStartStr || loggedOn > todayStr) continue;
    counts.set(loggedOn, (counts.get(loggedOn) ?? 0) + 1);
  }

  for (const session of focusResult.data ?? []) {
    const date = bucket(session.started_at);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return buildActivitySummary(counts, ACTIVITY_RANGE_DAYS, todayStr);
}

async function loadDashboardExtras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
  todayStr: string,
  timeZone: string | null,
  habitLogs: HabitLogRow[],
) {
  const yesterdayStr = addDaysToDateString(todayStr, -1);
  const focusBounds = timeZone
    ? zonedDayBounds(todayStr, timeZone)
    : {
        start: new Date(`${todayStr}T00:00:00.000Z`),
        end: new Date(`${addDaysToDateString(todayStr, 1)}T00:00:00.000Z`),
      };

  let habitsQuery = supabase
    .from("habits")
    .select("id, title, color")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  let focusQuery = supabase
    .from("focus_sessions")
    .select("actual_seconds")
    .eq("mode", "focus")
    .gte("started_at", focusBounds.start.toISOString())
    .lt("started_at", focusBounds.end.toISOString());

  let todayReviewQuery = supabase
    .from("daily_reviews")
    .select("id")
    .eq("review_date", todayStr);

  let intentReviewQuery = supabase
    .from("daily_reviews")
    .select("tomorrow_focus, review_date")
    .eq("review_date", yesterdayStr);

  let readingBookQuery = supabase
    .from("books")
    .select("id, title, current_page, total_pages")
    .eq("status", "reading")
    .order("updated_at", { ascending: false })
    .limit(1);

  let settingsQuery = supabase
    .from("user_settings")
    .select("daily_focus_goal_minutes, streak_freezes_remaining");

  if (userId) {
    habitsQuery = habitsQuery.eq("user_id", userId);
    focusQuery = focusQuery.eq("user_id", userId);
    todayReviewQuery = todayReviewQuery.eq("user_id", userId);
    intentReviewQuery = intentReviewQuery.eq("user_id", userId);
    readingBookQuery = readingBookQuery.eq("user_id", userId);
    settingsQuery = settingsQuery.eq("user_id", userId);
  }

  const [
    habitsResult,
    focusResult,
    todayReview,
    intentReview,
    readingBookResult,
    settingsResult,
  ] = await Promise.all([
    habitsQuery,
    focusQuery,
    todayReviewQuery.maybeSingle(),
    intentReviewQuery.maybeSingle(),
    readingBookQuery.maybeSingle(),
    settingsQuery.maybeSingle(),
  ]);

  const habits = habitsResult.data ?? [];
  const habitIdSet = new Set(habits.map((habit) => habit.id));

  const logsByHabit = new Map<string, string[]>();
  for (const log of habitLogs) {
    if (!habitIdSet.has(log.habit_id)) continue;
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.logged_on);
    logsByHabit.set(log.habit_id, list);
  }

  const habits_today: DashboardHabit[] = habits.map((habit) => {
    const dates = logsByHabit.get(habit.id) ?? [];
    const { current_streak, longest_streak } = computeStreaks(dates, todayStr);
    return {
      id: habit.id,
      title: habit.title,
      color: habit.color,
      completed_today: dates.includes(todayStr),
      current_streak,
      longest_streak,
    };
  });

  const focus_minutes = Math.round(
    (focusResult.data ?? []).reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
  );

  const intent = intentReview.data?.tomorrow_focus?.trim() || null;

  const readingRow = readingBookResult.data;
  let reading_book: {
    id: string;
    title: string;
    progress: number | null;
  } | null = null;
  if (readingRow) {
    const total = readingRow.total_pages;
    const progress =
      total && total > 0
        ? Math.min(100, Math.round((readingRow.current_page / total) * 100))
        : null;
    reading_book = {
      id: readingRow.id as string,
      title: (readingRow.title as string) || "Untitled",
      progress,
    };
  }

  const settingsRow = settingsResult.data;
  const freezes = Number(settingsRow?.streak_freezes_remaining);
  const daily_focus_goal_minutes = settingsRow
    ? clampDailyFocusGoal(
        Number(settingsRow.daily_focus_goal_minutes) ||
          FOCUS_DAILY_GOAL_DEFAULT,
      )
    : FOCUS_DAILY_GOAL_DEFAULT;
  const streak_freezes_remaining = Number.isFinite(freezes)
    ? Math.max(0, Math.min(3, Math.round(freezes)))
    : DEFAULT_USER_SETTINGS.streak_freezes_remaining;

  // Migration 022 may not be applied — fall back when streak column missing.
  if (settingsResult.error && /streak_freezes/i.test(settingsResult.error.message)) {
    let legacyQ = supabase
      .from("user_settings")
      .select("daily_focus_goal_minutes");
    if (userId) legacyQ = legacyQ.eq("user_id", userId);
    const legacy = await legacyQ.maybeSingle();
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
      reading_book,
      daily_focus_goal_minutes: legacy.data
        ? clampDailyFocusGoal(
            Number(legacy.data.daily_focus_goal_minutes) ||
              FOCUS_DAILY_GOAL_DEFAULT,
          )
        : FOCUS_DAILY_GOAL_DEFAULT,
      streak_freezes_remaining:
        DEFAULT_USER_SETTINGS.streak_freezes_remaining,
    };
  }

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
    reading_book,
    daily_focus_goal_minutes,
    streak_freezes_remaining,
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

  const [todayStr, timeZone] = await Promise.all([
    getTodayString(),
    getRequestTimeZone(),
  ]);
  const weekStartStr = startOfWeekDateString(todayStr);
  const weekDateStrs = Array.from({ length: 7 }, (_, i) =>
    addDaysToDateString(weekStartStr, i),
  );
  const weekEndStr = weekDateStrs[6]!;

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

  // Full habit history — one round-trip for accurate streaks + activity days.
  let habitLogsQ = supabase
    .from("habit_logs")
    .select("habit_id, logged_on");

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
    habitLogsQ = habitLogsQ.eq("user_id", scopedUserId);
  }

  const habitLogsPromise = habitLogsQ.then(
    (result) => (result.data ?? []) as HabitLogRow[],
  );

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
    habitLogsPromise.then((logs) =>
      loadActivity(
        supabase,
        scopedUserId,
        todayStr,
        timeZone,
        logs.map((log) => log.logged_on),
      ),
    ),
    habitLogsPromise.then((logs) =>
      loadDashboardExtras(supabase, scopedUserId, todayStr, timeZone, logs),
    ),
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

  const week = weekDateStrs.map((dateStr) => {
    const noon = new Date(`${dateStr}T12:00:00.000Z`);
    return {
      date: dateStr,
      label: noon.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      day_label: noon.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
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
    reading_book: extras.reading_book,
    daily_focus_goal_minutes: extras.daily_focus_goal_minutes,
    streak_freezes_remaining: extras.streak_freezes_remaining,
  };
}

/** Dashboard aggregates — request cache + optional cross-request cache. */
export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const todayStr = await getTodayString();
  const { user, userIdForAdminCache } = await resolveUserForData();
  if (!user) return emptyDashboard;

  try {
    if (userIdForAdminCache) {
      return await cachedQuery(
        ["dashboard", userIdForAdminCache, "v14", todayStr],
        [cacheTags.dashboard(userIdForAdminCache)],
        CACHE_TTL.dashboard,
        async () => loadDashboardData(userIdForAdminCache),
      )();
    }
    return await loadDashboardData(null);
  } catch (err) {
    console.error(
      "[dashboard] getDashboardData:",
      err instanceof Error ? err.message : err,
    );
    return emptyDashboard;
  }
});
