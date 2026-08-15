"use server";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery } from "@/lib/cache";
import { toDateString } from "@/lib/date-utils";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildActivitySummary,
  buildDashboardData,
  type ActivitySummary,
  type DashboardData,
} from "@/types/dashboard";

const ACTIVITY_RANGE_DAYS = 365; // rolling year, same idea as GitHub

const emptyActivity: ActivitySummary = {
  days: [],
  total: 0,
  active_days: 0,
  current_streak: 0,
};

const emptyDashboard: DashboardData = {
  stats: {
    active_tasks: 0,
    completed_tasks: 0,
    due_today: 0,
    overdue: 0,
    goals: 0,
    projects: 0,
  },
  today_tasks: [],
  overdue_tasks: [],
  week: [],
  goals: [],
  activity: emptyActivity,
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

  if (tasksResult.error) {
    console.error("[dashboard] activity tasks:", tasksResult.error.message);
  }
  if (habitsResult.error) {
    console.error("[dashboard] activity habits:", habitsResult.error.message);
  }
  if (focusResult.error) {
    console.error("[dashboard] activity focus:", focusResult.error.message);
  }

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

async function loadDashboardData(
  userId: string | null,
): Promise<DashboardData> {
  const supabase =
    userId && hasAdminClient() ? createAdminClient() : await createClient();

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

  if (userId && hasAdminClient()) {
    tasksQuery = tasksQuery.eq("user_id", userId);
    goalsQuery = goalsQuery.eq("user_id", userId);
    projectsQuery = projectsQuery.eq("user_id", userId);
  }

  const [tasksResult, goalsResult, projectsResult, activity] =
    await Promise.all([
      tasksQuery,
      goalsQuery,
      projectsQuery,
      loadActivity(supabase, userId && hasAdminClient() ? userId : null),
    ]);

  if (tasksResult.error) {
    console.error("[dashboard] getDashboardData:", tasksResult.error.message);
  }

  const data = buildDashboardData(
    tasksResult.data ?? [],
    goalsResult.count ?? 0,
    projectsResult.count ?? 0,
  );

  return { ...data, activity };
}

/** Dashboard aggregates — request cache + optional cross-request cache. */
export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const user = await getCurrentUser();
  if (!user) {
    return emptyDashboard;
  }

  if (hasAdminClient()) {
    return cachedQuery(
      ["dashboard", user.id],
      [cacheTags.dashboard(user.id)],
      CACHE_TTL.dashboard,
      async () => loadDashboardData(user.id),
    )();
  }

  return loadDashboardData(null);
});
