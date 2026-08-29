"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { computeStreaks, getWeekDays, startOfDay, startOfWeekSaturday, toDateString } from "@/lib/date-utils";
import { sameFocusThread } from "@/lib/focus-threads";
import type {
  DailyFocusGoal,
  FocusMode,
  FocusSession,
  FocusTodayMark,
  FocusWeekDay,
  TaskFocusToday,
} from "@/types/focus";
import {
  clampDailyFocusGoal,
  focusLevel,
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_MAX_SECONDS,
} from "@/types/focus";

export type FocusActionState = {
  error?: string;
};

type FocusSessionRow = Omit<FocusSession, "task_title"> & {
  tasks: { id: string; title: string } | null;
};

function mapFocusSession(row: FocusSessionRow): FocusSession {
  const task = row.tasks;
  return {
    id: row.id,
    user_id: row.user_id,
    mode: row.mode,
    planned_seconds: row.planned_seconds,
    actual_seconds: row.actual_seconds,
    completed: row.completed,
    note: row.note,
    task_id: row.task_id ?? task?.id ?? null,
    task_title: task?.title ?? null,
    started_at: row.started_at,
    ended_at: row.ended_at,
    created_at: row.created_at,
  };
}

async function revalidateFocus() {
  revalidatePath("/focus");
  revalidatePath("/tasks");
  revalidatePath("/review");
  revalidatePath("/analytics");
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  } else {
    revalidatePath("/dashboard");
  }
}

export async function getRecentFocusSessions(
  limit = 10,
): Promise<FocusSession[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("focus_sessions")
    .select(
      `
      id,
      user_id,
      mode,
      planned_seconds,
      actual_seconds,
      completed,
      note,
      task_id,
      started_at,
      ended_at,
      created_at,
      tasks ( id, title )
    `,
    )
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[focus] getRecentFocusSessions:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as FocusSessionRow[]).map(mapFocusSession);
}

export async function getTodayFocusStats() {
  const overview = await getFocusOverviewStats();
  return {
    sessions: overview.sessions,
    focus_minutes: overview.focus_minutes,
  };
}

function focusLevelFromMinutes(minutes: number): FocusWeekDay["level"] {
  return focusLevel(minutes);
}

/** Today totals + streak + last-7-day heatmap for the Focus page. */
export async function getFocusOverviewStats() {
  const supabase = await createClient();
  const days = getWeekDays(startOfWeekSaturday(new Date()));
  const today = toDateString(new Date());

  const streakLookback = new Date();
  streakLookback.setDate(streakLookback.getDate() - 120);
  streakLookback.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("id, actual_seconds, started_at, task_id, note")
    .eq("mode", "focus")
    .gte("started_at", streakLookback.toISOString());

  if (error) {
    console.error("[focus] getFocusOverviewStats:", error.message);
    return {
      sessions: 0,
      focus_minutes: 0,
      current_streak: 0,
      longest_streak: 0,
      week: days.map((day) => ({
        date: toDateString(day),
        minutes: 0,
        level: 0 as const,
      })),
      focus_by_day: {},
      today_marks: [],
    };
  }

  const minutesByDay = new Map<string, number>();
  const activeDates: string[] = [];
  const todayMarks: FocusTodayMark[] = [];

  for (const row of data ?? []) {
    const date = toDateString(new Date(row.started_at));
    const minutes = Math.round(row.actual_seconds / 60);
    if (minutes <= 0) continue;
    minutesByDay.set(date, (minutesByDay.get(date) ?? 0) + minutes);
    activeDates.push(date);
    if (date === today) {
      todayMarks.push({
        id: row.id,
        started_at: row.started_at,
        minutes,
        task_id: row.task_id ?? null,
        note: row.note ?? null,
      });
    }
  }

  const { current_streak, longest_streak } = computeStreaks(activeDates, today);

  const week: FocusWeekDay[] = days.map((day) => {
    const date = toDateString(day);
    const minutes = minutesByDay.get(date) ?? 0;
    return {
      date,
      minutes,
      level: focusLevelFromMinutes(minutes),
    };
  });

  const focus_by_day: Record<string, number> = {};
  for (const [date, minutes] of minutesByDay.entries()) {
    focus_by_day[date] = minutes;
  }

  const todayMinutes = minutesByDay.get(today) ?? 0;
  todayMarks.sort(
    (a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );

  return {
    sessions: todayMarks.length,
    focus_minutes: todayMinutes,
    current_streak,
    longest_streak,
    week,
    focus_by_day,
    today_marks: todayMarks,
  };
}

/** Today's logged focus seconds keyed by task id. */
export async function getTodayTaskFocus(): Promise<TaskFocusToday> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("task_id, actual_seconds")
    .eq("mode", "focus")
    .not("task_id", "is", null)
    .gte("started_at", startOfDay(new Date()).toISOString());

  if (error) {
    console.error("[focus] getTodayTaskFocus:", error.message);
    return {};
  }

  const totals: TaskFocusToday = {};
  for (const row of data ?? []) {
    if (!row.task_id || row.actual_seconds <= 0) continue;
    totals[row.task_id] = (totals[row.task_id] ?? 0) + row.actual_seconds;
  }
  return totals;
}

export async function getDailyFocusGoal(): Promise<DailyFocusGoal> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { minutes: FOCUS_DAILY_GOAL_DEFAULT, saved: false };
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("daily_focus_goal_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[focus] getDailyFocusGoal:", error.message);
    return { minutes: FOCUS_DAILY_GOAL_DEFAULT, saved: false };
  }

  if (!data) {
    return { minutes: FOCUS_DAILY_GOAL_DEFAULT, saved: false };
  }

  return {
    minutes: clampDailyFocusGoal(data.daily_focus_goal_minutes),
    saved: true,
  };
}

export async function updateDailyFocusGoal(minutes: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const value = clampDailyFocusGoal(minutes);
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      daily_focus_goal_minutes: value,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[focus] updateDailyFocusGoal:", error.message);
    return { error: error.message };
  }

  revalidatePath("/focus");
  return {};
}

export async function logFocusSession(input: {
  mode: FocusMode;
  planned_seconds: number;
  actual_seconds: number;
  completed: boolean;
  note?: string;
  task_id?: string | null;
  appendToThread?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  if (input.actual_seconds < 5) {
    return { error: "Session too short to log." };
  }

  if (input.actual_seconds > FOCUS_MAX_SECONDS) {
    return { error: "Sessions can be at most 12 hours." };
  }

  const ended = new Date();
  const started = new Date(ended.getTime() - input.actual_seconds * 1000);
  const taskId =
    input.mode === "focus" && input.task_id ? input.task_id : null;
  const note = input.note?.trim() || null;

  if (taskId) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError || !task) {
      return { error: "Linked task was not found." };
    }
  }

  const shouldAppend =
    input.appendToThread !== false && input.mode === "focus";

  if (shouldAppend) {
    const { data: todayRows } = await supabase
      .from("focus_sessions")
      .select(
        "id, mode, planned_seconds, actual_seconds, note, task_id, started_at",
      )
      .eq("user_id", user.id)
      .eq("mode", "focus")
      .gte("started_at", startOfDay(new Date()).toISOString())
      .order("started_at", { ascending: false })
      .limit(20);

    const incoming = {
      id: "incoming",
      mode: "focus" as const,
      started_at: started.toISOString(),
      task_id: taskId,
      note,
    };

    const match = (todayRows ?? []).find((row) =>
      sameFocusThread(row, incoming),
    );

    if (match) {
      const nextActual = Math.min(
        FOCUS_MAX_SECONDS,
        match.actual_seconds + input.actual_seconds,
      );
      const { error: appendError } = await supabase
        .from("focus_sessions")
        .update({
          actual_seconds: nextActual,
          planned_seconds: Math.max(match.planned_seconds, nextActual),
          completed: input.completed,
          note: note ?? match.note,
          task_id: taskId ?? match.task_id,
          ended_at: ended.toISOString(),
        })
        .eq("id", match.id)
        .eq("user_id", user.id);

      if (appendError) {
        return { error: appendError.message };
      }

      await revalidateFocus();
      return {};
    }
  }

  const { error } = await supabase.from("focus_sessions").insert({
    user_id: user.id,
    mode: input.mode,
    planned_seconds: input.planned_seconds,
    actual_seconds: input.actual_seconds,
    completed: input.completed,
    note,
    task_id: taskId,
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateFocus();
  return {};
}

export async function logManualFocusSession(
  _prevState: FocusActionState | null,
  formData: FormData,
): Promise<FocusActionState> {
  const hours = Number(formData.get("hours") ?? 0);
  const minutes = Number(formData.get("minutes") ?? 0);
  const note = (formData.get("note") as string | null)?.trim() || undefined;
  const taskRaw = (formData.get("task_id") as string | null)?.trim() || "";
  const task_id = taskRaw.length ? taskRaw : null;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return { error: "Enter a valid duration." };
  }

  if (hours < 0 || minutes < 0 || minutes > 59) {
    return { error: "Use hours and 0–59 minutes." };
  }

  const actual_seconds = Math.round(hours * 3600 + minutes * 60);

  if (actual_seconds < 60) {
    return { error: "Log at least 1 minute." };
  }

  return logFocusSession({
    mode: "focus",
    planned_seconds: actual_seconds,
    actual_seconds,
    completed: true,
    note,
    task_id,
    appendToThread: false,
  });
}

export async function updateFocusSession(input: {
  sessionId: string;
  actual_seconds: number;
  planned_seconds: number;
  completed: boolean;
  note?: string;
  task_id?: string | null;
  ended_at: string;
  started_at?: string;
  absorbIds?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  if (input.actual_seconds < 5) {
    return { error: "Session too short to log." };
  }

  if (input.actual_seconds > FOCUS_MAX_SECONDS) {
    return { error: "Sessions can be at most 12 hours." };
  }

  const taskId =
    input.task_id && input.task_id.length > 0 ? input.task_id : null;

  if (taskId) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError || !task) {
      return { error: "Linked task was not found." };
    }
  }

  const { error } = await supabase
    .from("focus_sessions")
    .update({
      actual_seconds: input.actual_seconds,
      planned_seconds: input.planned_seconds,
      completed: input.completed,
      note: input.note?.trim() || null,
      task_id: taskId,
      ended_at: input.ended_at,
      ...(input.started_at ? { started_at: input.started_at } : {}),
    })
    .eq("id", input.sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  const absorbIds = (input.absorbIds ?? []).filter(
    (id) => id && id !== input.sessionId,
  );
  if (absorbIds.length > 0) {
    const { error: absorbError } = await supabase
      .from("focus_sessions")
      .delete()
      .in("id", absorbIds)
      .eq("user_id", user.id);

    if (absorbError) {
      return { error: absorbError.message };
    }
  }

  await revalidateFocus();
  return {};
}

export async function deleteFocusSession(sessionId: string) {
  return deleteFocusSessions([sessionId]);
}

export async function deleteFocusSessions(sessionIds: string[]) {
  if (sessionIds.length === 0) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("focus_sessions")
    .delete()
    .in("id", sessionIds);

  if (error) {
    console.error("[focus] deleteFocusSessions:", error.message);
    return;
  }

  await revalidateFocus();
}
