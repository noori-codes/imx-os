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

/** OAuth / provider avatar URL when present. */
export function resolveAvatarUrl(user: {
  user_metadata?: Record<string, unknown> | null;
}): string | null {
  const meta = user.user_metadata ?? {};
  const url =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/** One or two letters for the avatar fallback. */
export function resolveInitials(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const name = resolveDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 1).toUpperCase();
  }
  const email = user.email?.trim();
  if (email) return email.slice(0, 1).toUpperCase();
  return "?";
}

export const DISPLAY_NAME_MAX = 40;

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, DISPLAY_NAME_MAX);
}
