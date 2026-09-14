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
  header?: ReactNode;
  kpis?: ReactNode;
  timer: ReactNode;
  sky: ReactNode;
  sessions: ReactNode;
};

export function FocusWorkspace({
  header,
  kpis,
  timer,
  sky,
  sessions,
}: FocusWorkspaceProps) {
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
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <div className="focus-studio">
        <div className="focus-studio-wash" aria-hidden="true" />
        <div
          className={cn(
            "focus-studio-content flex w-full flex-col gap-6",
            continueBarVisible &&
              "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
          )}
        >
          {header ? (
            <div className="focus-reveal">{header}</div>
          ) : null}
          {kpis ? (
            <div className="focus-reveal focus-reveal-delay-1">{kpis}</div>
          ) : null}

          <div className="focus-reveal focus-reveal-delay-2 w-full">
            {timer}
          </div>

          <div className="focus-reveal focus-reveal-delay-3 mt-2 w-full border-t border-border/40 pt-8">
            {sky}
          </div>

          <div className="mt-4 w-full sm:mt-6" id="focus-recent-sessions">
            {sessions}
          </div>
        </div>
      </div>

      <FocusContinueBar />
    </AppPageFrame>
  );
}
