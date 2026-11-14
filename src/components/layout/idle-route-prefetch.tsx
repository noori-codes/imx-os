"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { MOBILE_MORE_ITEMS, MOBILE_TAB_ITEMS, NAV_ITEMS } from "@/lib/constants";

/** Hottest destinations first — don’t stampede the RSC/data layer at once. */
const IDLE_PREFETCH_HREFS = Array.from(
  new Set([
    ...MOBILE_TAB_ITEMS.map((item) => item.href),
    "/calendar",
    "/goals",
    "/notes",
    "/review",
    "/analytics",
    "/books",
    "/search",
    "/settings",
    ...NAV_ITEMS.map((item) => item.href),
    ...MOBILE_MORE_ITEMS.map((item) => item.href),
  ]),
);

/**
 * Prefetch primary destinations when the browser is idle so soft-nav feels instant.
 * Staggers requests — a simultaneous burst was saturating Supabase and hanging nav.
 */
export function IdleRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let gapId: number | undefined;
    let index = 0;

    function prefetchNext() {
      if (cancelled) return;
      const href = IDLE_PREFETCH_HREFS[index];
      if (!href) return;
      index += 1;
      try {
        router.prefetch(href);
      } catch {
        // Prefetch is best-effort.
      }
      if (index < IDLE_PREFETCH_HREFS.length) {
        gapId = window.setTimeout(prefetchNext, 350);
      }
    }

    function run() {
      if (cancelled) return;
      prefetchNext();
    }

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      idleId = ric.call(window, run, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(run, 1200);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
      if (gapId != null) window.clearTimeout(gapId);
    };
  }, [router]);

  return null;
}
