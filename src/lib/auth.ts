import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Fast cookie JWT read — OK for shell/layout display after middleware.
 * Never use to key service-role / admin caches.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

/**
 * Network-verified user — required for any path that feeds
 * createAdminClient() / cachedQuery with a userId, or sensitive mutations.
 * Do not call from the app layout: it blocks every soft-nav on Auth latency.
 */
export const getVerifiedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Resolve user for data loaders.
 * When the service-role cache is available, prefer a verified user id for
 * cache keys — but if Auth is briefly unreachable, fall back to the cookie
 * session and skip admin cache (RLS client) instead of returning empty data.
 *
 * Same change set: `actions/{dashboard,analytics,search,notes,ai}.ts`,
 * plus `actions/auth.ts` try/catch + `app/auth/callback/route.ts`.
 */
export async function resolveUserForData(): Promise<{
  user: User | null;
  userIdForAdminCache: string | null;
}> {
  if (hasAdminClient()) {
    const verified = await getVerifiedUser();
    if (verified) {
      return { user: verified, userIdForAdminCache: verified.id };
    }
    const sessionUser = await getCurrentUser();
    return { user: sessionUser, userIdForAdminCache: null };
  }

  const user = await getCurrentUser();
  return { user, userIdForAdminCache: null };
}
