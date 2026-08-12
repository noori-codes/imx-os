"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectWithCounts } from "@/types/project";

export type ProjectActionState = {
  error?: string;
};

function revalidateGoal(goalId: string) {
  revalidatePath("/goals", "layout");
  revalidatePath(`/goals/${goalId}`);
}

export async function getProjectsByGoal(
  goalId: string,
): Promise<ProjectWithCounts[]> {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false });

  if (error || !projects) {
    console.error("[projects] getProjectsByGoal:", error?.message);
    return [];
  }

  if (projects.length === 0) {
    return [];
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("project_id, completed")
    .in(
      "project_id",
      projects.map((p) => p.id),
    );

  const counts = new Map<string, { total: number; completed: number }>();
  for (const task of tasks ?? []) {
    if (!task.project_id) continue;
    const current = counts.get(task.project_id) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (task.completed) current.completed += 1;
    counts.set(task.project_id, current);
  }

  return projects.map((project) => {
    const c = counts.get(project.id) ?? { total: 0, completed: 0 };
    return {
      ...project,
      task_count: c.total,
      completed_task_count: c.completed,
    };
  });
}

export async function getProject(
  goalId: string,
  projectId: string,
): Promise<Project | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("goal_id", goalId)
    .single();

  if (error) {
    console.error("[projects] getProject:", error.message);
    return null;
  }

  return data;
}

export async function createProject(
  goalId: string,
  _prevState: ProjectActionState | null,
  formData: FormData,
): Promise<ProjectActionState> {
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
    return { error: "Project title is required." };
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    goal_id: goalId,
    title,
    description,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateGoal(goalId);
  return {};
}

export async function deleteProject(goalId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("goal_id", goalId);

  if (error) {
    console.error("[projects] deleteProject:", error.message);
    return;
  }

  revalidateGoal(goalId);
  revalidatePath("/tasks");
}
