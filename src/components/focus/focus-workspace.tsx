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
        <div className="w-full">{timer}</div>

        {!isRunning ? (
          <div className="mt-6 border-t border-border/30 pt-8 sm:mt-8 sm:pt-10">
            {sky}
          </div>
        ) : null}
      </div>

      {!isRunning ? (
        <div className="mt-12 w-full sm:mt-14">{sessions}</div>
      ) : null}

      <FocusContinueBar />
    </>
  );
}
