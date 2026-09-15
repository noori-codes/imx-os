"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import {
  initialDueForRecurrence,
  parseTaskRecurrence,
  resetDueForRecurrence,
} from "@/lib/task-recurrence";
import { addDays, toDateString, startOfDay } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type {
  FocusLinkableTask,
  Task,
  TaskProjectOption,
  TaskRecurrence,
  TaskView,
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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
    recurrence: row.recurrence ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    context,
    context_href,
  };
}

/** Reopen completed recurring tasks once their due day has passed. */
export async function syncRecurringTasks(
  supabase?: SupabaseServerClient,
) {
  const client = supabase ?? (await createClient());
  const today = toDateString(startOfDay(new Date()));

  const { data, error } = await client
    .from("tasks")
    .select("id, recurrence, completed, due_date")
    .eq("completed", true)
    .not("recurrence", "is", null)
    .lt("due_date", today);

  if (error) {
    console.error("[tasks] syncRecurringTasks:", error.message);
    return;
  }

  await Promise.all(
    (data ?? []).map(async (row) => {
      const recurrence = parseTaskRecurrence(row.recurrence);
      if (!recurrence) return;
      const { error: updateError } = await client
        .from("tasks")
        .update({
          completed: false,
          due_date: resetDueForRecurrence(recurrence),
        })
        .eq("id", row.id);
      if (updateError) {
        console.error("[tasks] syncRecurringTasks update:", updateError.message);
      }
    }),
  );
}

/**
 * Run recurring sync after the response — never blocks dashboard/tasks reads.
 * Deduped once per request via React cache.
 */
export const scheduleRecurringTaskSync = cache(
  (supabase: SupabaseServerClient) => {
    after(() => {
      void syncRecurringTasks(supabase);
    });
  },
);

const TASK_SELECT = `
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

  return (data ?? []).map((row) => ({
    ...row,
    recurrence: (row.recurrence as TaskRecurrence) ?? null,
  }));
}

const OPEN_LIMIT = 150;
const DONE_LIMIT = 50;

function mapTaskRows(data: unknown): TaskWithContext[] {
  return ((data ?? []) as unknown as TaskRow[]).map(mapTask);
}

/** Bounded fetch for a tasks board view — never loads the full table. */
export async function getTasksForView(
  view: TaskView,
): Promise<TaskWithContext[]> {
  const supabase = await createClient();
  scheduleRecurringTaskSync(supabase);

  const today = toDateString(startOfDay(new Date()));
  const weekEnd = toDateString(addDays(startOfDay(new Date()), 7));

  try {
    switch (view) {
      case "inbox": {
        const [open, done] = await Promise.all([
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .eq("completed", false)
            .is("project_id", null)
            .order("due_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(OPEN_LIMIT),
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .eq("completed", true)
            .is("project_id", null)
            .order("updated_at", { ascending: false })
            .limit(DONE_LIMIT),
        ]);
        if (open.error) console.error("[tasks] inbox open:", open.error.message);
        if (done.error) console.error("[tasks] inbox done:", done.error.message);
        return [...mapTaskRows(open.data), ...mapTaskRows(done.data)];
      }
      case "today": {
        const [open, done] = await Promise.all([
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .eq("completed", false)
            .not("due_date", "is", null)
            .lte("due_date", today)
            .order("due_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(OPEN_LIMIT),
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .eq("completed", true)
            .eq("due_date", today)
            .order("updated_at", { ascending: false })
            .limit(DONE_LIMIT),
        ]);
        if (open.error) console.error("[tasks] today open:", open.error.message);
        if (done.error) console.error("[tasks] today done:", done.error.message);
        return [...mapTaskRows(open.data), ...mapTaskRows(done.data)];
      }
      case "week": {
        const { data, error } = await supabase
          .from("tasks")
          .select(TASK_SELECT)
          .eq("completed", false)
          .not("due_date", "is", null)
          .lt("due_date", weekEnd)
          .order("due_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(OPEN_LIMIT);
        if (error) console.error("[tasks] week:", error.message);
        return mapTaskRows(data);
      }
      case "upcoming": {
        const { data, error } = await supabase
          .from("tasks")
          .select(TASK_SELECT)
          .eq("completed", false)
          .gt("due_date", today)
          .order("due_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(OPEN_LIMIT);
        if (error) console.error("[tasks] upcoming:", error.message);
        return mapTaskRows(data);
      }
      case "all": {
        const [open, done] = await Promise.all([
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .eq("completed", false)
            .order("due_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(OPEN_LIMIT),
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .eq("completed", true)
            .order("updated_at", { ascending: false })
            .limit(DONE_LIMIT),
        ]);
        if (open.error) console.error("[tasks] all open:", open.error.message);
        if (done.error) console.error("[tasks] all done:", done.error.message);
        return [...mapTaskRows(open.data), ...mapTaskRows(done.data)];
      }
    }
  } catch (error) {
    console.error("[tasks] getTasksForView:", error);
    return [];
  }
}

export type TaskBoardStats = {
  openCount: number;
  overdueCount: number;
  doneToday: number;
  counts: Record<TaskView, number>;
};

/** Head-only counts for tabs and stats — no row payloads. */
export async function getTaskBoardStats(): Promise<TaskBoardStats> {
  const supabase = await createClient();
  const today = toDateString(startOfDay(new Date()));
  const weekEnd = toDateString(addDays(startOfDay(new Date()), 7));

  const [
    open,
    overdue,
    doneToday,
    inbox,
    todayCount,
    week,
    upcoming,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", false),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .not("due_date", "is", null)
      .lt("due_date", today),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", true)
      .eq("due_date", today),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .is("project_id", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .not("due_date", "is", null)
      .lte("due_date", today),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .not("due_date", "is", null)
      .lt("due_date", weekEnd),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .gt("due_date", today),
  ]);

  const openCount = open.count ?? 0;

  return {
    openCount,
    overdueCount: overdue.count ?? 0,
    doneToday: doneToday.count ?? 0,
    counts: {
      inbox: inbox.count ?? 0,
      today: todayCount.count ?? 0,
      week: week.count ?? 0,
      upcoming: upcoming.count ?? 0,
      all: openCount,
    },
  };
}

/** @deprecated Prefer getTasksForView — kept for callers that need a capped all-list. */
export async function getAllTasks(): Promise<TaskWithContext[]> {
  return getTasksForView("all");
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
  const dueDateRaw = (formData.get("due_date") as string) || "";
  const projectIdRaw = formData.get("project_id") as string;
  const recurrence = parseTaskRecurrence(formData.get("recurrence"));

  if (!title) {
    return { error: "Task title is required." };
  }

  const due_date = initialDueForRecurrence(
    recurrence,
    dueDateRaw.length ? dueDateRaw : null,
  );
  const project_id = projectIdRaw?.length ? projectIdRaw : null;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date,
    project_id,
    recurrence,
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateTaskViews();
  return {};
}

export async function updateTask(
  taskId: string,
  input: {
    title: string;
    due_date: string | null;
    recurrence?: TaskRecurrence;
    /** Pass `null` to move to Inbox; omit to leave unchanged. */
    project_id?: string | null;
  },
): Promise<TaskActionState> {
  const supabase = await createClient();
  const title = input.title.trim();

  if (!title) {
    return { error: "Task title is required." };
  }

  const recurrence =
    input.recurrence === undefined
      ? undefined
      : parseTaskRecurrence(input.recurrence);

  const patch: {
    title: string;
    due_date: string | null;
    recurrence?: TaskRecurrence;
    project_id?: string | null;
  } = {
    title,
    due_date:
      recurrence !== undefined
        ? initialDueForRecurrence(recurrence, input.due_date)
        : input.due_date,
  };

  if (recurrence !== undefined) {
    patch.recurrence = recurrence;
  }

  if (input.project_id !== undefined) {
    patch.project_id = input.project_id;
  }

  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  await revalidateTaskViews();
  return {};
}

/** Create one inbox task per non-empty line (used by Review → tomorrow focus). */
export async function createTasksFromLines(
  lines: string[],
  dueDate: string | null,
): Promise<{ error?: string; created?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const titles = lines
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((title) => title.length > 0)
    .slice(0, 12);

  if (titles.length === 0) {
    return { error: "Add at least one line to create tasks." };
  }

  const { error } = await supabase.from("tasks").insert(
    titles.map((title) => ({
      user_id: user.id,
      title,
      due_date: dueDate,
      project_id: null,
      recurrence: null,
    })),
  );

  if (error) {
    return { error: error.message };
  }

  await revalidateTaskViews();
  return { created: titles.length };
}

export async function toggleTaskComplete(
  taskId: string,
  completed: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId);

  if (error) {
    console.error("[tasks] toggleTaskComplete:", error.message);
    return { error: error.message };
  }

  await revalidateTaskViews();
  return {};
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
