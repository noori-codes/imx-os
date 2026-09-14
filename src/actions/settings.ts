"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { clampDailyFocusGoal } from "@/types/focus";
import {
  DEFAULT_USER_SETTINGS,
  type AppThemePref,
  type UserSettings,
  type UserSettingsPatch,
} from "@/types/settings";
import type { FocusClock, FocusProfileId } from "@/types/focus";
import type { TaskView } from "@/types/task";

function parseTheme(value: unknown): AppThemePref {
  if (value === "light" || value === "dark" || value === "system") return value;
  return DEFAULT_USER_SETTINGS.theme;
}

function parseTaskView(value: unknown): TaskView {
  if (
    value === "today" ||
    value === "week" ||
    value === "inbox" ||
    value === "upcoming" ||
    value === "all"
  ) {
    return value;
  }
  return DEFAULT_USER_SETTINGS.default_task_view;
}

function parseProfile(value: unknown): FocusProfileId {
  if (value === "classic" || value === "deep" || value === "quick") return value;
  return DEFAULT_USER_SETTINGS.focus_profile;
}

function parseClock(value: unknown): FocusClock {
  if (value === "up" || value === "down") return value;
  return DEFAULT_USER_SETTINGS.focus_clock;
}

function mapRow(row: Record<string, unknown> | null): UserSettings {
  if (!row) {
    return { ...DEFAULT_USER_SETTINGS, saved: false };
  }

  return {
    daily_focus_goal_minutes: clampDailyFocusGoal(
      Number(row.daily_focus_goal_minutes) ||
        DEFAULT_USER_SETTINGS.daily_focus_goal_minutes,
    ),
    theme: parseTheme(row.theme),
    default_task_view: parseTaskView(row.default_task_view),
    focus_profile: parseProfile(row.focus_profile),
    focus_clock: parseClock(row.focus_clock),
    auto_start_next: Boolean(row.auto_start_next),
    chime_enabled:
      row.chime_enabled == null
        ? DEFAULT_USER_SETTINGS.chime_enabled
        : Boolean(row.chime_enabled),
    celebrate_enabled:
      row.celebrate_enabled == null
        ? DEFAULT_USER_SETTINGS.celebrate_enabled
        : Boolean(row.celebrate_enabled),
    saved: true,
  };
}

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...DEFAULT_USER_SETTINGS, saved: false };
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "daily_focus_goal_minutes, theme, default_task_view, focus_profile, focus_clock, auto_start_next, chime_enabled, celebrate_enabled",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[settings] getUserSettings:", error.message);
    return { ...DEFAULT_USER_SETTINGS, saved: false };
  }

  return mapRow(data as Record<string, unknown> | null);
}

export async function updateUserSettings(
  patch: UserSettingsPatch,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const current = await getUserSettings();
  const next = {
    daily_focus_goal_minutes: clampDailyFocusGoal(
      patch.daily_focus_goal_minutes ?? current.daily_focus_goal_minutes,
    ),
    theme: parseTheme(patch.theme ?? current.theme),
    default_task_view: parseTaskView(
      patch.default_task_view ?? current.default_task_view,
    ),
    focus_profile: parseProfile(patch.focus_profile ?? current.focus_profile),
    focus_clock: parseClock(patch.focus_clock ?? current.focus_clock),
    auto_start_next: patch.auto_start_next ?? current.auto_start_next,
    chime_enabled: patch.chime_enabled ?? current.chime_enabled,
    celebrate_enabled: patch.celebrate_enabled ?? current.celebrate_enabled,
  };

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      ...next,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[settings] updateUserSettings:", error.message);
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/tasks");
  revalidatePath("/focus");
  revalidatePath("/analytics");
  return {};
}
