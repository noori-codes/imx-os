"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  FocusLinkableTask,
  Task,
  TaskProjectOption,
  TaskWithContext,
} from "@/types/task";

export type TaskActionState = {
  error?: string;
};

type TaskRow = Task & {
  projects: {
    id: string;
    title: string;
    goal_id: string;
    goals: { id: string; title: string } | null;
  } | null;
};

function mapTask(row: TaskRow): TaskWithContext {
  const project = row.projects;
  const goal = project?.goals ?? null;

  let context: string | null = null;
  let context_href: string | null = null;

  if (project && goal) {
    context = `${goal.title} · ${project.title}`;
    context_href = `/goals/${goal.id}/projects/${project.id}`;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    title: row.title,
    completed: row.completed,
    due_date: row.due_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    context,
    context_href,
  };
}

const TASK_SELECT = `
  id,
  user_id,
  project_id,
  title,
  completed,
  due_date,
  created_at,
  updated_at,
  projects (
    id,
    title,
    goal_id,
    goals ( id, title )
  )
`;

async function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/focus");
  revalidatePath("/calendar");
  revalidatePath("/goals", "layout");
  revalidatePath("/review");
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  } else {
    revalidatePath("/dashboard");
  }
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

export async function getAllTasks(): Promise<TaskWithContext[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getAllTasks:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as TaskRow[]).map(mapTask);
}

export async function getProjectTasks(
  projectId: string,
): Promise<TaskWithContext[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("project_id", projectId)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getProjectTasks:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as TaskRow[]).map(mapTask);
}

export async function getTaskProjectOptions(): Promise<TaskProjectOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, goals ( title )")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tasks] getTaskProjectOptions:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const goal = Array.isArray(row.goals) ? row.goals[0] : row.goals;
    const goalTitle =
      goal && typeof goal === "object" && "title" in goal
        ? String((goal as { title: string }).title)
        : null;
    return {
      id: row.id,
      label: goalTitle ? `${goalTitle} · ${row.title}` : row.title,
    };
  });
}

/** Open tasks for linking from the Focus timer (newest first). */
export async function getFocusLinkableTasks(
  limit = 40,
): Promise<FocusLinkableTask[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("completed", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[tasks] getFocusLinkableTasks:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as TaskRow[]).map((row) => {
    const mapped = mapTask(row);
    return {
      id: mapped.id,
      title: mapped.title,
      context: mapped.context,
    };
  });
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

  await revalidateTaskViews();
  return {};
}

export async function updateTask(
  taskId: string,
  input: { title: string; due_date: string | null },
): Promise<TaskActionState> {
  const supabase = await createClient();
  const title = input.title.trim();

  if (!title) {
    return { error: "Task title is required." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      due_date: input.due_date,
    })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  await revalidateTaskViews();
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

  await revalidateTaskViews();
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("[tasks] deleteTask:", error.message);
    return;
  }

  await revalidateTaskViews();
}
