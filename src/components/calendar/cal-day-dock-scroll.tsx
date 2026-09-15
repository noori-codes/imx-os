"use client";

import { useEffect, useRef } from "react";

/**
 * On narrow layouts the day dock sits under the grid. After the user picks a
 * day, scroll it into view so the selection isn’t buried below the fold.
 */
export function CalDayDockScroll({ date }: { date: string }) {
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (window.matchMedia("(min-width: 1280px)").matches) return;
    document
      .getElementById("cal-day-dock")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [date]);

  return null;
}
