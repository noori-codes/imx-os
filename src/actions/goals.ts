"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import type { Goal, GoalWithCounts } from "@/types/goal";

export type GoalActionState = {
  error?: string;
};

async function revalidateGoals() {
  revalidatePath("/goals", "layout");
  revalidatePath("/tasks");
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  } else {
    revalidatePath("/dashboard");
  }
}

export async function getGoals(): Promise<GoalWithCounts[]> {
  try {
  const supabase = await createClient();

  const [goalsResult, projectsResult, tasksResult] = await Promise.all([
    supabase.from("goals").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, goal_id"),
    supabase
      .from("tasks")
      .select("id, project_id, completed")
      .not("project_id", "is", null),
  ]);

  if (goalsResult.error || !goalsResult.data) {
    console.error("[goals] getGoals:", goalsResult.error?.message);
    return [];
  }
  if (projectsResult.error) {
    console.error("[goals] getGoals projects:", projectsResult.error.message);
  }
  if (tasksResult.error) {
    console.error("[goals] getGoals tasks:", tasksResult.error.message);
  }

  const goals = goalsResult.data;
  const projects = projectsResult.data;
  const tasks = tasksResult.data;

  const projectIdsByGoal = new Map<string, string[]>();
  for (const project of projects ?? []) {
    const list = projectIdsByGoal.get(project.goal_id) ?? [];
    list.push(project.id);
    projectIdsByGoal.set(project.goal_id, list);
  }

  const taskStatsByProject = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const task of tasks ?? []) {
    if (!task.project_id) continue;
    const current = taskStatsByProject.get(task.project_id) ?? {
      total: 0,
      completed: 0,
    };
    current.total += 1;
    if (task.completed) current.completed += 1;
    taskStatsByProject.set(task.project_id, current);
  }

  return goals.map((goal) => {
    const goalProjectIds = projectIdsByGoal.get(goal.id) ?? [];
    let task_count = 0;
    let completed_task_count = 0;
    for (const pid of goalProjectIds) {
      const stats = taskStatsByProject.get(pid);
      if (!stats) continue;
      task_count += stats.total;
      completed_task_count += stats.completed;
    }

    const raw = goal as Goal & {
      target_date?: string | null;
      status?: string | null;
    };
    const status =
      raw.status === "paused" ||
      raw.status === "completed" ||
      raw.status === "archived"
        ? raw.status
        : "active";

    return {
      ...goal,
      target_date: raw.target_date ?? null,
      status,
      project_count: goalProjectIds.length,
      task_count,
      completed_task_count,
      first_project_id: goalProjectIds[0] ?? null,
    };
  });
  } catch (err) {
    console.error(
      "[goals] getGoals:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();

  if (error) {
    console.error("[goals] getGoal:", error.message);
    return null;
  }

  if (!data) return null;

  const status =
    data.status === "paused" ||
    data.status === "completed" ||
    data.status === "archived"
      ? data.status
      : "active";

  return {
    ...data,
    target_date: data.target_date ?? null,
    status,
  };
}

export async function getGoalWithCounts(
  goalId: string,
): Promise<GoalWithCounts | null> {
  const goals = await getGoals();
  return goals.find((g) => g.id === goalId) ?? null;
}

export async function createGoal(
  _prevState: GoalActionState | null,
  formData: FormData,
): Promise<GoalActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const targetRaw = (formData.get("target_date") as string)?.trim() || "";
  const target_date =
    /^\d{4}-\d{2}-\d{2}$/.test(targetRaw) ? targetRaw : null;

  if (!title) {
    return { error: "Goal title is required." };
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    title,
    description,
    status: "active",
  };
  if (target_date) row.target_date = target_date;

  let { error } = await supabase.from("goals").insert(row);

  // Migration 022 not applied yet — retry without new columns.
  if (error && /target_date|status/i.test(error.message)) {
    const legacy = await supabase.from("goals").insert({
      user_id: user.id,
      title,
      description,
    });
    error = legacy.error;
  }

  if (error) {
    return { error: "Couldn’t save. Try again." };
  }

  await revalidateGoals();
  return {};
}

export async function updateGoal(
  goalId: string,
  input: {
    title: string;
    description: string | null;
    target_date?: string | null;
    status?: string;
  },
): Promise<GoalActionState> {
  const title = input.title.trim();
  if (!title) {
    return { error: "Goal title is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const patch: Record<string, unknown> = {
    title,
    description: input.description,
  };
  if (input.target_date !== undefined) {
    patch.target_date =
      input.target_date && /^\d{4}-\d{2}-\d{2}$/.test(input.target_date)
        ? input.target_date
        : null;
  }
  if (
    input.status === "active" ||
    input.status === "paused" ||
    input.status === "completed" ||
    input.status === "archived"
  ) {
    patch.status = input.status;
  }

  let { data, error } = await supabase
    .from("goals")
    .update(patch)
    .eq("id", goalId)
    .eq("user_id", user.id)
    .select("id");

  if (error && /target_date|status/i.test(error.message)) {
    const legacy = await supabase
      .from("goals")
      .update({ title, description: input.description })
      .eq("id", goalId)
      .eq("user_id", user.id)
      .select("id");
    data = legacy.data;
    error = legacy.error;
  }

  if (error) {
    return { error: "Couldn’t save. Try again." };
  }
  if (!data?.length) {
    return { error: "Not found." };
  }

  await revalidateGoals();
  return {};
}

/** Hardened deletes — pairs with `projects.ts` + goals-board/project-list toasts. */
export async function deleteGoal(
  goalId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[goals] deleteGoal:", error.message);
    return { error: "Couldn’t delete that goal." };
  }
  if (!data?.length) return { error: "Not found." };

  await revalidateGoals();
  return {};
}
