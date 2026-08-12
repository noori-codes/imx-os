"use server";

import { createClient } from "@/lib/supabase/server";
import { buildDashboardData, type DashboardData } from "@/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [tasksResult, goalsResult, projectsResult] = await Promise.all([
    supabase
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
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("goals").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
  ]);

  if (tasksResult.error) {
    console.error("[dashboard] getDashboardData:", tasksResult.error.message);
  }

  const goalCount = goalsResult.count ?? 0;
  const projectCount = projectsResult.count ?? 0;

  return buildDashboardData(
    tasksResult.data ?? [],
    goalCount,
    projectCount,
  );
}
