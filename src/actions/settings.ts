"use server";

import { revalidatePath } from "next/cache";

import {
  DISPLAY_NAME_MAX,
  normalizeDisplayName,
} from "@/lib/display-name";
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

/** Prefers auth user_metadata.full_name (used by dashboard greeting). */
export async function updateDisplayName(
  rawName: string,
): Promise<{ error?: string; name?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const name = normalizeDisplayName(rawName);
  if (name.length < 1) {
    return { error: "Enter a name (at least 1 character)." };
  }
  if (name.length > DISPLAY_NAME_MAX) {
    return { error: `Keep it under ${DISPLAY_NAME_MAX} characters.` };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: name,
      name,
    },
  });

  if (error) {
    console.error("[settings] updateDisplayName:", error.message);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { name };
}

const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function listUserAvatarPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId, { limit: 20 });
  if (error || !data) return [] as string[];
  return data
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => `${userId}/${item.name}`);
}

/** Upload a custom profile photo to Storage and pin it on user metadata. */
export async function uploadAvatar(
  formData: FormData,
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "Keep the photo under 2 MB." };
  }

  const ext = AVATAR_MIME[file.type];
  if (!ext) {
    return { error: "Use JPG, PNG, WebP, or GIF." };
  }

  const path = `${user.id}/avatar.${ext}`;
  const existing = await listUserAvatarPaths(supabase, user.id);
  const stale = existing.filter((item) => item !== path);
  if (stale.length > 0) {
    await supabase.storage.from(AVATAR_BUCKET).remove(stale);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[settings] uploadAvatar:", uploadError.message);
    return {
      error:
        uploadError.message.includes("Bucket not found")
          ? "Avatar storage isn’t set up yet. Run the latest Supabase migration."
          : uploadError.message,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: metaError } = await supabase.auth.updateUser({
    data: { custom_avatar_url: url },
  });

  if (metaError) {
    console.error("[settings] uploadAvatar meta:", metaError.message);
    return { error: metaError.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { url };
}

/** Remove custom photo and fall back to provider avatar / initials. */
export async function removeAvatar(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const paths = await listUserAvatarPaths(supabase, user.id);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(paths);
    if (removeError) {
      console.error("[settings] removeAvatar storage:", removeError.message);
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: { custom_avatar_url: "" },
  });

  if (error) {
    console.error("[settings] removeAvatar meta:", error.message);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return {};
}
