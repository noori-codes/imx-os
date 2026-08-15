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
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  } else {
    revalidatePath("/dashboard");
  }
}

export async function getGoals(): Promise<GoalWithCounts[]> {
  const supabase = await createClient();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !goals) {
    console.error("[goals] getGoals:", error?.message);
    return [];
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, goal_id");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, project_id")
    .not("project_id", "is", null);

  const projectIdsByGoal = new Map<string, string[]>();
  for (const project of projects ?? []) {
    const list = projectIdsByGoal.get(project.goal_id) ?? [];
    list.push(project.id);
    projectIdsByGoal.set(project.goal_id, list);
  }

  const tasksByProject = new Map<string, number>();
  for (const task of tasks ?? []) {
    if (task.project_id) {
      tasksByProject.set(
        task.project_id,
        (tasksByProject.get(task.project_id) ?? 0) + 1,
      );
    }
  }

  return goals.map((goal) => {
    const goalProjectIds = projectIdsByGoal.get(goal.id) ?? [];
    const task_count = goalProjectIds.reduce(
      (sum, pid) => sum + (tasksByProject.get(pid) ?? 0),
      0,
    );

    return {
      ...goal,
      project_count: goalProjectIds.length,
      task_count,
    };
  });
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

  return data;
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

  if (!title) {
    return { error: "Goal title is required." };
  }

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title,
    description,
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateGoals();
  return {};
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("goals").delete().eq("id", goalId);

  if (error) {
    console.error("[goals] deleteGoal:", error.message);
    return;
  }

  await revalidateGoals();
  revalidatePath("/tasks");
}
