import { revalidatePath, updateTag, unstable_cache } from "next/cache";

/** Cache tag helpers — always scoped by user id. */
export const cacheTags = {
  analytics: (userId: string) => `analytics:${userId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  notes: (userId: string) => `notes:${userId}`,
  search: (userId: string) => `search:${userId}`,
};

export const CACHE_TTL = {
  /** Heavy aggregations — safe to be briefly stale */
  analytics: 60,
  dashboard: 30,
  /** Notes list/detail — short so edits show up quickly */
  notes: 30,
  /** Search results — short so edits show up quickly */
  search: 30,
} as const;

/**
 * Invalidate cached reads after a mutation.
 * Uses updateTag for read-your-own-writes (Server Actions only).
 * Paths keep the existing UI refresh.
 */
export function revalidateUserCaches(userId: string) {
  updateTag(cacheTags.analytics(userId));
  updateTag(cacheTags.dashboard(userId));
  updateTag(cacheTags.notes(userId));
  updateTag(cacheTags.search(userId));
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/notes");
  revalidatePath("/search");
}

/**
 * Habit mutations only — skip notes/search and avoid revalidatePath("/dashboard")
 * so optimistic dashboard UI is not blocked by a full RSC rebuild.
 * updateTag keeps the next cold/soft dashboard load fresh.
 */
export function revalidateHabitCaches(userId: string) {
  updateTag(cacheTags.dashboard(userId));
  updateTag(cacheTags.analytics(userId));
  revalidatePath("/habits");
  revalidatePath("/review");
  revalidatePath("/analytics");
}

/** Typed wrapper around unstable_cache with consistent defaults. */
export function cachedQuery<TArgs extends unknown[], TResult>(
  keyParts: string[],
  tags: string[],
  revalidate: number,
  fn: (...args: TArgs) => Promise<TResult>,
) {
  return unstable_cache(fn, keyParts, { tags, revalidate });
}
