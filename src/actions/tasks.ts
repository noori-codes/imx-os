"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types/task";

export type TaskActionState = {
  error?: string;
};

const TASKS_PATH = "/tasks";

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getTasks:", error.message);
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

  if (!title) {
    return { error: "Task title is required." };
  }

  const due_date = dueDateRaw?.length ? dueDateRaw : null;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(TASKS_PATH);
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

  revalidatePath(TASKS_PATH);
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("[tasks] deleteTask:", error.message);
    return;
  }

  revalidatePath(TASKS_PATH);
}
