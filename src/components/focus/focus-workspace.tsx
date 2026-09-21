"use client";

import { useEffect, type ReactNode } from "react";

import { useFocusContinueBarVisible } from "@/components/focus/focus-continue-bar";
import { AppPageFrame } from "@/components/shared/app-page-frame";
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
  }, [inSession]);

  if (inSession) {
    return (
      <div
        className="focus-session-lock flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
        data-focus-scene={scene}
      >
        <div className="flex min-h-0 flex-1 flex-col">{timer}</div>
      </div>
    );
  }

  return (
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
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
    </AppPageFrame>
  );
}
