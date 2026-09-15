"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { MOBILE_MORE_ITEMS, MOBILE_TAB_ITEMS, NAV_ITEMS } from "@/lib/constants";

const IDLE_PREFETCH_HREFS = Array.from(
  new Set([
    ...MOBILE_TAB_ITEMS.map((item) => item.href),
    ...NAV_ITEMS.map((item) => item.href),
    ...MOBILE_MORE_ITEMS.map((item) => item.href),
    "/search",
    "/settings",
  ]),
);

/**
 * Prefetch primary destinations when the browser is idle so soft-nav feels instant.
 */
export function IdleRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    function run() {
      if (cancelled) return;
      for (const href of IDLE_PREFETCH_HREFS) {
        router.prefetch(href);
      }
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
    };
  }, [router]);

  return null;
}
