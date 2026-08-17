"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import type { FocusMode, FocusSession } from "@/types/focus";
import { FOCUS_MAX_SECONDS } from "@/types/focus";

export type FocusActionState = {
  error?: string;
};

async function revalidateFocus() {
  revalidatePath("/focus");
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
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[focus] getRecentFocusSessions:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getTodayFocusStats() {
  const supabase = await createClient();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("mode, actual_seconds, completed")
    .eq("mode", "focus")
    .gte("started_at", start.toISOString());

  if (error) {
    console.error("[focus] getTodayFocusStats:", error.message);
    return { sessions: 0, focus_minutes: 0 };
  }

  const sessions = data?.length ?? 0;
  const focus_minutes = Math.round(
    (data ?? []).reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
  );

  return { sessions, focus_minutes };
}

export async function logFocusSession(input: {
  mode: FocusMode;
  planned_seconds: number;
  actual_seconds: number;
  completed: boolean;
  note?: string;
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

  const { error } = await supabase.from("focus_sessions").insert({
    user_id: user.id,
    mode: input.mode,
    planned_seconds: input.planned_seconds,
    actual_seconds: input.actual_seconds,
    completed: input.completed,
    note: input.note?.trim() || null,
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
  });
}

export async function deleteFocusSession(sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("focus_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("[focus] deleteFocusSession:", error.message);
    return;
  }

  await revalidateFocus();
}
