/** Resolve the user's preferred name from auth metadata, else email local-part. */
export function resolveDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const meta = user.user_metadata ?? {};
  const full =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  if (full?.trim()) return full.trim();
  return user.email?.split("@")[0] ?? "there";
}

/** First word for greetings (“Good morning, Ada”). */
export function resolveGreetingName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  return resolveDisplayName(user).split(/\s+/)[0] || "there";
}

export const DISPLAY_NAME_MAX = 40;

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, DISPLAY_NAME_MAX);
}
