"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types/task";

export type TaskActionState = {
  error?: string;
};

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/goals", "layout");
}

export async function getStandaloneTasks(): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .is("project_id", null)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getStandaloneTasks:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getProjectTasks:", error.message);
    return [];
  }

  return data ?? [];
}

export async function createTask(
  _prevState: TaskActionState | null,
  formData: FormData,
): Promise<TaskActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create tasks." };
  }

  const title = (formData.get("title") as string)?.trim();
  const dueDateRaw = formData.get("due_date") as string;
  const projectIdRaw = formData.get("project_id") as string;

  if (!title) {
    return { error: "Task title is required." };
  }

  const due_date = dueDateRaw?.length ? dueDateRaw : null;
  const project_id = projectIdRaw?.length ? projectIdRaw : null;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date,
    project_id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateTaskViews();
  return {};
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId);

  if (error) {
    console.error("[tasks] toggleTaskComplete:", error.message);
    return;
  }

  revalidateTaskViews();
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("[tasks] deleteTask:", error.message);
    return;
  }

  revalidateTaskViews();
}
