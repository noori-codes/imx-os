"use server";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery } from "@/lib/cache";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildDashboardData, type DashboardData } from "@/types/dashboard";

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
};

async function loadDashboardData(
  userId: string | null,
): Promise<DashboardData> {
  const supabase = userId && hasAdminClient()
    ? createAdminClient()
    : await createClient();

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

  const [tasksResult, goalsResult, projectsResult] = await Promise.all([
    tasksQuery,
    goalsQuery,
    projectsQuery,
  ]);

  if (tasksResult.error) {
    console.error("[dashboard] getDashboardData:", tasksResult.error.message);
  }

  return buildDashboardData(
    tasksResult.data ?? [],
    goalsResult.count ?? 0,
    projectsResult.count ?? 0,
  );
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
