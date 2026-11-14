"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top progress bar during client navigations.
 * Stays visible until the route actually changes (no 8s failsafe that hid
 * while RSC was still hanging 30–50s on dead Supabase sockets).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [visible, setVisible] = useState(false);
  const [stuck, setStuck] = useState(false);
  const safetyTimerRef = useRef<number | undefined>(undefined);
  const previousPathRef = useRef(`${pathname}?${search}`);
  const skipScrollRef = useRef(false);
  const navigatingRef = useRef(false);

  function clearSafety() {
    window.clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = undefined;
  }

  function startProgress() {
    clearSafety();
    navigatingRef.current = true;
    setStuck(false);
    setVisible(true);
    // After 4s, switch to a calmer “still loading” pulse — never hide early.
    safetyTimerRef.current = window.setTimeout(() => {
      if (navigatingRef.current) setStuck(true);
    }, 4000);
  }

  // Navigation finished — hide the bar and scroll to top when the path changes.
  useEffect(() => {
    clearSafety();
    navigatingRef.current = false;
    setVisible(false);
    setStuck(false);

    const nextKey = `${pathname}?${search}`;
    const pathChanged = previousPathRef.current.split("?")[0] !== pathname;
    previousPathRef.current = nextKey;

    if (!pathChanged) return;

    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }

    const main = document.getElementById("main-content");
    if (main) {
      main.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [pathname, search]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (
        anchor.target === "_blank" ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      startProgress();
    }

    function onPopState() {
      skipScrollRef.current = true;
      startProgress();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-foreground/10"
      role="progressbar"
      aria-label={stuck ? "Still loading page" : "Loading page"}
      aria-busy="true"
    >
      <div
        className={
          stuck
            ? "nav-progress-bar-stuck h-full w-full bg-foreground/55"
            : "nav-progress-bar h-full w-1/3 rounded-full bg-foreground/80"
        }
      />
    </div>
  );
}
