"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top progress bar during client navigations.
 * Shows immediately so soft-nav never feels frozen.
 * Scrolls main content to top on forward navigations (not back/forward).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [visible, setVisible] = useState(false);
  const safetyTimerRef = useRef<number | undefined>(undefined);
  const previousPathRef = useRef(`${pathname}?${search}`);
  const skipScrollRef = useRef(false);

  function clearSafety() {
    window.clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = undefined;
  }

  function startProgress() {
    clearSafety();
    setVisible(true);
    // Failsafe: never leave the bar stuck if the route update is missed.
    safetyTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 8000);
  }

  // Navigation finished — hide the bar and scroll to top when the path changes.
  useEffect(() => {
    clearSafety();
    setVisible(false);

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
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/15"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="nav-progress-bar h-full w-1/3 rounded-full bg-primary" />
    </div>
  );
}
