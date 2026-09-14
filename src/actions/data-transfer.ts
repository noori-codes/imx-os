"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export const DATA_EXPORT_VERSION = 1 as const;

export type ImxExportPayload = {
  version: typeof DATA_EXPORT_VERSION;
  exported_at: string;
  user_id: string;
  data: {
    user_settings: Record<string, unknown> | null;
    goals: Record<string, unknown>[];
    projects: Record<string, unknown>[];
    tasks: Record<string, unknown>[];
    habits: Record<string, unknown>[];
    habit_logs: Record<string, unknown>[];
    notes: Record<string, unknown>[];
    calendar_events: Record<string, unknown>[];
    daily_reviews: Record<string, unknown>[];
    books: Record<string, unknown>[];
    focus_sessions: Record<string, unknown>[];
  };
};

function asRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row),
  );
}

function withUserId(
  rows: Record<string, unknown>[],
  userId: string,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const next: Record<string, unknown> = { ...row, user_id: userId };
    delete next.search_vector;
    return next;
  });
}

export async function exportUserData(): Promise<
  { ok: true; payload: ImxExportPayload } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const uid = user.id;

  const [
    settings,
    goals,
    projects,
    tasks,
    habits,
    habitLogs,
    notes,
    events,
    reviews,
    books,
    sessions,
  ] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("goals").select("*").eq("user_id", uid),
    supabase.from("projects").select("*").eq("user_id", uid),
    supabase.from("tasks").select("*").eq("user_id", uid),
    supabase.from("habits").select("*").eq("user_id", uid),
    supabase.from("habit_logs").select("*").eq("user_id", uid),
    supabase.from("notes").select("*").eq("user_id", uid),
    supabase.from("calendar_events").select("*").eq("user_id", uid),
    supabase.from("daily_reviews").select("*").eq("user_id", uid),
    supabase.from("books").select("*").eq("user_id", uid),
    supabase.from("focus_sessions").select("*").eq("user_id", uid),
  ]);

  const errors = [
    settings.error,
    goals.error,
    projects.error,
    tasks.error,
    habits.error,
    habitLogs.error,
    notes.error,
    events.error,
    reviews.error,
    books.error,
    sessions.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("[data] export:", errors.map((e) => e?.message).join("; "));
    return { ok: false, error: "Could not export all data. Try again." };
  }

  const settingsRow = settings.data
    ? ({ ...(settings.data as Record<string, unknown>) } as Record<
        string,
        unknown
      >)
    : null;
  if (settingsRow) {
    delete settingsRow.last_ai_insight_at;
  }

  return {
    ok: true,
    payload: {
      version: DATA_EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      user_id: uid,
      data: {
        user_settings: settingsRow,
        goals: asRows(goals.data),
        projects: asRows(projects.data),
        tasks: asRows(tasks.data),
        habits: asRows(habits.data),
        habit_logs: asRows(habitLogs.data),
        notes: asRows(notes.data),
        calendar_events: asRows(events.data),
        daily_reviews: asRows(reviews.data),
        books: asRows(books.data),
        focus_sessions: asRows(sessions.data),
      },
    },
  };
}

export async function importUserData(
  raw: unknown,
): Promise<{ ok: true; imported: number } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid export file." };
  }

  const payload = raw as {
    version?: unknown;
    data?: unknown;
  };

  if (payload.version !== DATA_EXPORT_VERSION) {
    return { ok: false, error: "Unsupported export version." };
  }

  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
    return { ok: false, error: "Export file is missing data." };
  }

  const data = payload.data as Record<string, unknown>;
  const uid = user.id;
  let imported = 0;

  async function upsertTable(
    table: string,
    rows: Record<string, unknown>[],
    onConflict: string,
  ) {
    if (rows.length === 0) return;
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from(table).upsert(chunk, {
        onConflict,
      });
      if (error) {
        throw new Error(`${table}: ${error.message}`);
      }
      imported += chunk.length;
    }
  }

  try {
    const settingsRaw = data.user_settings;
    if (settingsRaw && typeof settingsRaw === "object" && !Array.isArray(settingsRaw)) {
      const settings = { ...(settingsRaw as Record<string, unknown>) };
      delete settings.last_ai_insight_at;
      settings.user_id = uid;
      const { error } = await supabase.from("user_settings").upsert(settings, {
        onConflict: "user_id",
      });
      if (error) throw new Error(`user_settings: ${error.message}`);
      imported += 1;
    }

    await upsertTable("goals", withUserId(asRows(data.goals), uid), "id");
    await upsertTable("projects", withUserId(asRows(data.projects), uid), "id");
    await upsertTable("tasks", withUserId(asRows(data.tasks), uid), "id");
    await upsertTable("habits", withUserId(asRows(data.habits), uid), "id");
    await upsertTable(
      "habit_logs",
      withUserId(asRows(data.habit_logs), uid),
      "id",
    );
    await upsertTable("notes", withUserId(asRows(data.notes), uid), "id");
    await upsertTable(
      "calendar_events",
      withUserId(asRows(data.calendar_events), uid),
      "id",
    );
    await upsertTable(
      "daily_reviews",
      withUserId(asRows(data.daily_reviews), uid),
      "id",
    );
    await upsertTable("books", withUserId(asRows(data.books), uid), "id");
    await upsertTable(
      "focus_sessions",
      withUserId(asRows(data.focus_sessions), uid),
      "id",
    );
  } catch (error) {
    console.error("[data] import:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Import failed.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, imported };
}
