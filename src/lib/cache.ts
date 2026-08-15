import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/** Cache tag helpers — always scoped by user id. */
export const cacheTags = {
  analytics: (userId: string) => `analytics:${userId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  search: (userId: string) => `search:${userId}`,
};

export const CACHE_TTL = {
  /** Heavy aggregations — safe to be briefly stale */
  analytics: 60,
  dashboard: 30,
  /** Search results — short so edits show up quickly */
  search: 30,
} as const;

/**
 * Invalidate cached reads after a mutation.
 * Paths keep the existing UI refresh; tags bust cross-request caches.
 */
export function revalidateUserCaches(userId: string) {
  revalidateTag(cacheTags.analytics(userId), "max");
  revalidateTag(cacheTags.dashboard(userId), "max");
  revalidateTag(cacheTags.search(userId), "max");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/search");
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
