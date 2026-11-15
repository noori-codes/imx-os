"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

import { useFocusContinueBarVisible } from "@/components/focus/focus-continue-bar";
import { FocusTheater } from "@/components/focus/focus-theater";
import {
  REVEAL_DELAY,
  SectionReveal,
} from "@/components/motion/section-reveal";
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
  const reduce = useReducedMotion();

  useEffect(() => {
    hydrateFocusScene();
  }, []);

  useEffect(() => {
    if (!inSession) return;
    window.scrollTo(0, 0);
  }, [inSession]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {inSession ? (
        <m.div
          key="focus-session"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <FocusTheater active>
            <div
              className="focus-session-lock flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
              data-focus-scene={scene}
            >
              <div className="flex min-h-0 flex-1 flex-col">{timer}</div>
            </div>
          </FocusTheater>
        </m.div>
      ) : (
        <m.div
          key="focus-idle"
          className="flex w-full min-w-0 flex-1 flex-col"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <FocusPageFrame>
            <div className="focus-studio" data-focus-scene={scene}>
              <div className="focus-studio-wash" aria-hidden="true" />
              <div className="focus-studio-glow" aria-hidden="true" />
              <div className="focus-studio-glow-soft" aria-hidden="true" />
              <div className="focus-studio-content flex w-full flex-col gap-8">
                <SectionReveal emphasize className="w-full">
                  {timer}
                </SectionReveal>

                <SectionReveal
                  delay={REVEAL_DELAY[1]}
                  className="w-full border-t border-border/40 pt-8"
                >
                  {sky}
                </SectionReveal>

                <SectionReveal
                  delay={REVEAL_DELAY[2]}
                  className="w-full"
                  id="focus-recent-sessions"
                >
                  {sessions}
                </SectionReveal>
              </div>
            </div>
          </FocusPageFrame>
        </m.div>
      )}
    </AnimatePresence>
  );
}
