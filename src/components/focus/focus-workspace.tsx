"use client";

import type { ReactNode } from "react";

import {
  FocusContinueBar,
  useFocusContinueBarVisible,
} from "@/components/focus/focus-continue-bar";
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

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col",
          continueBarVisible &&
            "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto w-full max-w-xl">{timer}</div>

        <div
          className={cn(
            "mt-6 border-t border-border/30 pt-8 transition-opacity duration-500 sm:mt-8 sm:pt-10",
            isRunning && "opacity-60",
          )}
        >
          {sky}
        </div>
      </div>

      <div
        className={cn(
          "mt-12 w-full transition-opacity duration-500 sm:mt-14",
          isRunning && "max-sm:hidden sm:opacity-40",
        )}
        aria-hidden={isRunning ? true : undefined}
      >
        {sessions}
      </div>

      <FocusContinueBar />
    </>
  );
}
