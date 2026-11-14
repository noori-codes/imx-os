"use client";

import { useEffect } from "react";

import { useFocusContinueBarVisible } from "@/components/focus/focus-continue-bar";
import { useFocusTimer } from "@/stores/focus-timer";

/**
 * Keeps document datasets in sync with the focus timer so shell chrome
 * (tab bar padding, chat, capture) hides anywhere — not only on /focus.
 */
export function FocusChromeSync() {
  const isRunning = useFocusTimer((s) => s.isRunning);
  const continueVisible = useFocusContinueBarVisible();
  const inSession = isRunning || continueVisible;

  useEffect(() => {
    const html = document.documentElement;

    if (isRunning) html.dataset.focusRunning = "true";
    else delete html.dataset.focusRunning;

    if (inSession) html.dataset.focusSession = "true";
    else delete html.dataset.focusSession;

    return () => {
      delete html.dataset.focusRunning;
      delete html.dataset.focusSession;
    };
  }, [isRunning, inSession]);

  return null;
}
