"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { calendarHref } from "@/lib/calendar";
import { addDays, parseDateString, toDateString } from "@/lib/date-utils";
import type { CalendarView } from "@/types/calendar";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable ||
    Boolean(target.closest("[role='dialog']"))
  );
}

/** ← / → move the selected day; T jumps to today. */
export function CalendarKeyboardNav({
  view,
  date,
}: {
  view: CalendarView;
  date: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        router.push(calendarHref(view, toDateString(new Date())));
        return;
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      event.preventDefault();
      const anchor = parseDateString(date);
      const next = toDateString(
        addDays(anchor, event.key === "ArrowRight" ? 1 : -1),
      );
      router.push(calendarHref(view, next));
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, router, view]);

  return null;
}
