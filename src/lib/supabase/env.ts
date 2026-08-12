function normalizeSupabaseUrl(url: string) {
  // Users often copy the REST API URL by mistake — strip it.
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export function isSupabaseConfigured() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !key) return false;
  if (rawUrl.includes("your-project-id")) return false;
  if (key === "your-anon-key") return false;

  const url = normalizeSupabaseUrl(rawUrl);
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return false;
  }

  return true;
}

export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add your project URL and anon key from https://supabase.com/dashboard/project/_/settings/api",
    );
  }

  const url = normalizeSupabaseUrl(rawUrl!);

  if (rawUrl !== url) {
    console.warn(
      "[imx-os] NEXT_PUBLIC_SUPABASE_URL should not include /rest/v1 — using:",
      url,
    );
  }

  return { url, key: key! };
}
