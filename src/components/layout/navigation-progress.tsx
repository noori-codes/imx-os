"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top progress bar during client navigations.
 * Appears only if navigation takes >120ms (avoids flicker).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | undefined>(undefined);
  const safetyTimerRef = useRef<number | undefined>(undefined);

  function clearTimers() {
    window.clearTimeout(showTimerRef.current);
    window.clearTimeout(safetyTimerRef.current);
    showTimerRef.current = undefined;
    safetyTimerRef.current = undefined;
  }

  // Navigation finished — always clear any pending show and hide the bar.
  useEffect(() => {
    clearTimers();
    setVisible(false);
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

      clearTimers();
      showTimerRef.current = window.setTimeout(() => {
        setVisible(true);
        // Failsafe: never leave the bar stuck if the route update is missed.
        safetyTimerRef.current = window.setTimeout(() => {
          setVisible(false);
        }, 8000);
      }, 120);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
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
