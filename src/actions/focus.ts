"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import type { FocusMode, FocusSession } from "@/types/focus";

export type FocusActionState = {
  error?: string;
};

async function revalidateFocus() {
  revalidatePath("/focus");
  revalidatePath("/review");
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

  const { error } = await supabase.from("focus_sessions").insert({
    user_id: user.id,
    mode: input.mode,
    planned_seconds: input.planned_seconds,
    actual_seconds: input.actual_seconds,
    completed: input.completed,
    note: input.note?.trim() || null,
    ended_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateFocus();
  return {};
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
