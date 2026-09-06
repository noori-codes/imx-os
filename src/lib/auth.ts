import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Current user for layouts / reads.
 * Uses getSession (cookie JWT) — middleware already refreshed the session.
 * Prefer getVerifiedUser() for sensitive mutations when you need a network check.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

/** Network-verified user — use for privileged writes when JWT trust isn't enough. */
export const getVerifiedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
