"use client";

import { useEffect, type ReactNode } from "react";

import {
  FocusContinueBar,
  useFocusContinueBarVisible,
} from "@/components/focus/focus-continue-bar";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";

type FocusWorkspaceProps = {
  timer: ReactNode;
  sky: ReactNode;
  sessions: ReactNode;
};

export function FocusWorkspace({ timer, sky, sessions }: FocusWorkspaceProps) {
  const isRunning = useFocusTimer((s) => s.isRunning);
  const continueBarVisible = useFocusContinueBarVisible();

  useEffect(() => {
    if (!isRunning) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.dataset.focusSession = "true";
    window.scrollTo(0, 0);

    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      delete html.dataset.focusSession;
    };
  }, [isRunning]);

  if (isRunning) {
    return (
      <div className="focus-session-lock flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col">{timer}</div>
      </div>
    );
  }

  return (
    <AppPageFrame className="max-w-5xl gap-0 md:py-8">
      <div
        className={cn(
          "flex w-full flex-col",
          continueBarVisible &&
            "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="w-full">{timer}</div>

        <div className="mt-6 border-t border-border/30 pt-8 sm:mt-8 sm:pt-10">
          {sky}
        </div>
      </div>

      <div className="mt-12 w-full sm:mt-14" id="focus-recent-sessions">
        {sessions}
      </div>

      <FocusContinueBar />
    </AppPageFrame>
  );
}
