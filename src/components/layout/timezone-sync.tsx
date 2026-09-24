"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TIMEZONE_COOKIE = "imx-tz";

/**
 * Keeps `imx-tz` in sync with the browser IANA zone so server
 * “today” matches the user’s calendar day (not UTC on Vercel).
 */
export function TimezoneSync() {
  const router = useRouter();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;

    const match = document.cookie.match(
      new RegExp(`(?:^|; )${TIMEZONE_COOKIE}=([^;]*)`),
    );
    const current = match ? decodeURIComponent(match[1]!) : null;
    if (current === tz) return;

    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
