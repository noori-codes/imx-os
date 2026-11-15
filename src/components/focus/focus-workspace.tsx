"use client";

import { useEffect, type ReactNode } from "react";

import { useFocusContinueBarVisible } from "@/components/focus/focus-continue-bar";
import { FocusTheater } from "@/components/focus/focus-theater";
import { cn } from "@/lib/utils";
import {
  focusSceneForTrack,
  hydrateFocusScene,
  useFocusSound,
} from "@/stores/focus-sound";
import { useFocusTimer } from "@/stores/focus-timer";

type FocusWorkspaceProps = {
  timer: ReactNode;
  sky: ReactNode;
  sessions: ReactNode;
};

/** Full-bleed idle frame — matches dashboard / tasks edge padding. */
function FocusPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "focus-page-frame flex w-full min-w-0 max-w-none flex-1 flex-col",
        "px-4 pt-4 pb-[calc(1.25rem+var(--mobile-tab-h))] sm:px-5",
        "md:px-6 md:pt-5 md:pb-8",
        "lg:px-8 lg:pt-6 lg:pb-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FocusWorkspace({
  timer,
  sky,
  sessions,
}: FocusWorkspaceProps) {
  const isRunning = useFocusTimer((s) => s.isRunning);
  const continueBarVisible = useFocusContinueBarVisible();
  // Keep the session shell while paused so the timer doesn't remount and wipe time.
  const inSession = isRunning || continueBarVisible;
  const soundId = useFocusSound((s) => s.activeId);
  const scene = focusSceneForTrack(soundId);

  useEffect(() => {
    hydrateFocusScene();
  }, []);

  useEffect(() => {
    if (!inSession) return;
    window.scrollTo(0, 0);
  }, [inSession]);

  if (inSession) {
    return (
      <FocusTheater active>
        <div
          className="focus-session-lock flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
          data-focus-scene={scene}
        >
          <div className="flex min-h-0 flex-1 flex-col">{timer}</div>
        </div>
      </FocusTheater>
    );
  }

  return (
    <FocusPageFrame>
      <div className="focus-studio" data-focus-scene={scene}>
        <div className="focus-studio-wash" aria-hidden="true" />
        <div className="focus-studio-glow" aria-hidden="true" />
        <div className="focus-studio-glow-soft" aria-hidden="true" />
        <div className="focus-studio-content flex w-full flex-col gap-8">
          <div className="focus-reveal w-full">{timer}</div>

          <div className="focus-reveal focus-reveal-delay-1 w-full border-t border-border/40 pt-8">
            {sky}
          </div>

          <div
            className="focus-reveal focus-reveal-delay-2 w-full"
            id="focus-recent-sessions"
          >
            {sessions}
          </div>
        </div>
      </div>
    </FocusPageFrame>
  );
}
