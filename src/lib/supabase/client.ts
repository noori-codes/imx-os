import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { supabaseFetch } from "@/lib/supabase/fetch";

export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key, {
    global: { fetch: supabaseFetch },
  });
}
