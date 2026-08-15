import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** One auth lookup per request — shared across layouts/actions. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
