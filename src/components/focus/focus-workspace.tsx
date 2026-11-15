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
  pulse: ReactNode;
  log: ReactNode;
};

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
        "px-4 pt-3 pb-[calc(0.85rem+var(--mobile-tab-h))] sm:px-5",
        "md:px-6 md:pt-4 md:pb-5",
        "lg:px-7 lg:pt-4 lg:pb-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Focus desk — daily instrument.
 * Idle: board + pulse side by side, session log below.
 * Live: quiet theater shell.
 */
export function FocusWorkspace({ timer, pulse, log }: FocusWorkspaceProps) {
  const isRunning = useFocusTimer((s) => s.isRunning);
  const continueBarVisible = useFocusContinueBarVisible();
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
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
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
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <FocusPageFrame>
            <div className="focus-studio" data-focus-scene={scene}>
              <div className="focus-studio-wash" aria-hidden="true" />
              <div className="focus-studio-content focus-desk">
                <SectionReveal
                  emphasize
                  className="focus-desk-board flex h-full min-h-0 min-w-0 flex-col"
                >
                  {timer}
                </SectionReveal>

                <SectionReveal
                  delay={REVEAL_DELAY[1]}
                  className="focus-desk-pulse focus-surface min-w-0"
                >
                  {pulse}
                </SectionReveal>

                <SectionReveal
                  delay={REVEAL_DELAY[2]}
                  className="focus-desk-log focus-surface min-w-0"
                  id="focus-recent-sessions"
                >
                  {log}
                </SectionReveal>
              </div>
            </div>
          </FocusPageFrame>
        </m.div>
      )}
    </AnimatePresence>
  );
}
