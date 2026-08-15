"use server";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery } from "@/lib/cache";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SearchResponse, SearchResult } from "@/types/search";

function sanitizeQuery(raw: string) {
  return raw.trim().slice(0, 120);
}

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function runSearch(
  query: string,
  userId: string | null,
): Promise<SearchResponse> {
  const supabase =
    userId && hasAdminClient() ? createAdminClient() : await createClient();

  if (hasAdminClient() && userId) {
    // RPC relies on auth.uid() — use ILIKE fallback with explicit user_id.
    return fallbackSearch(supabase, query, userId);
  }

  const { data, error } = await supabase.rpc("search_imx", {
    search_query: query,
    result_limit: 40,
  });

  if (!error && data) {
    return {
      query,
      results: data as SearchResult[],
    };
  }

  if (error) {
    console.error("[search] rpc:", error.message);
  }

  return fallbackSearch(supabase, query, null);
}

async function fallbackSearch(
  supabase:
    | Awaited<ReturnType<typeof createClient>>
    | ReturnType<typeof createAdminClient>,
  query: string,
  userId: string | null,
): Promise<SearchResponse> {
  const pattern = `%${escapeIlike(query)}%`;

  let tasksQ = supabase
    .from("tasks")
    .select("id, title, completed, due_date, project_id")
    .ilike("title", pattern)
    .limit(10);
  let goalsQ = supabase
    .from("goals")
    .select("id, title, description")
    .ilike("title", pattern)
    .limit(10);
  let projectsQ = supabase
    .from("projects")
    .select("id, title, description, goal_id")
    .ilike("title", pattern)
    .limit(10);
  let notesQ = supabase
    .from("notes")
    .select("id, title, type, journal_date")
    .ilike("title", pattern)
    .limit(10);
  let habitsQ = supabase
    .from("habits")
    .select("id, title, description")
    .eq("archived", false)
    .ilike("title", pattern)
    .limit(10);
  let eventsQ = supabase
    .from("calendar_events")
    .select("id, title, event_date")
    .ilike("title", pattern)
    .limit(10);

  if (userId) {
    tasksQ = tasksQ.eq("user_id", userId);
    goalsQ = goalsQ.eq("user_id", userId);
    projectsQ = projectsQ.eq("user_id", userId);
    notesQ = notesQ.eq("user_id", userId);
    habitsQ = habitsQ.eq("user_id", userId);
    eventsQ = eventsQ.eq("user_id", userId);
  }

  const [tasks, goals, projects, notes, habits, events] = await Promise.all([
    tasksQ,
    goalsQ,
    projectsQ,
    notesQ,
    habitsQ,
    eventsQ,
  ]);

  const results: SearchResult[] = [];

  for (const task of tasks.data ?? []) {
    results.push({
      id: task.id,
      entity_type: "task",
      title: task.title,
      subtitle: task.completed
        ? "Completed task"
        : task.due_date
          ? `Task · due ${task.due_date}`
          : "Task",
      href: task.project_id ? "/goals" : "/tasks",
      rank: 0.5,
    });
  }

  for (const goal of goals.data ?? []) {
    results.push({
      id: goal.id,
      entity_type: "goal",
      title: goal.title,
      subtitle: goal.description || "Goal",
      href: `/goals/${goal.id}`,
      rank: 0.5,
    });
  }

  for (const project of projects.data ?? []) {
    results.push({
      id: project.id,
      entity_type: "project",
      title: project.title,
      subtitle: project.description || "Project",
      href: `/goals/${project.goal_id}/projects/${project.id}`,
      rank: 0.5,
    });
  }

  for (const note of notes.data ?? []) {
    results.push({
      id: note.id,
      entity_type: "note",
      title: note.title,
      subtitle:
        note.type === "journal"
          ? `Journal · ${note.journal_date ?? ""}`
          : "Note",
      href: `/notes/${note.id}`,
      rank: 0.5,
    });
  }

  for (const habit of habits.data ?? []) {
    results.push({
      id: habit.id,
      entity_type: "habit",
      title: habit.title,
      subtitle: habit.description || "Habit",
      href: "/habits",
      rank: 0.5,
    });
  }

  for (const event of events.data ?? []) {
    results.push({
      id: event.id,
      entity_type: "event",
      title: event.title,
      subtitle: `Event · ${event.event_date}`,
      href: `/calendar?date=${event.event_date}`,
      rank: 0.5,
    });
  }

  return { query, results };
}

/**
 * Search is request-memoized; identical queries are cross-request cached
 * for 30s when the service role key is available.
 */
export const searchAll = cache(
  async (rawQuery: string): Promise<SearchResponse> => {
    const query = sanitizeQuery(rawQuery);

    if (query.length < 2) {
      return { query, results: [] };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { query, results: [] };
    }

    const normalized = query.toLowerCase();

    if (hasAdminClient()) {
      return cachedQuery(
        ["search", user.id, normalized],
        [cacheTags.search(user.id)],
        CACHE_TTL.search,
        async () => runSearch(query, user.id),
      )();
    }

    return runSearch(query, null);
  },
);
