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
  rail: ReactNode;
  sessions: ReactNode;
};

export function FocusWorkspace({ timer, rail, sessions }: FocusWorkspaceProps) {
  const isRunning = useFocusTimer((s) => s.isRunning);
  const continueBarVisible = useFocusContinueBarVisible();

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start lg:gap-8",
          continueBarVisible && "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0",
        )}
      >
        <div className="min-w-0 order-1">{timer}</div>

        <aside className="min-w-0 order-2 lg:sticky lg:top-20">{rail}</aside>
      </div>

      <div
        className={cn(
          "mt-6 transition-opacity duration-500 ease-out sm:mt-8",
          isRunning && "max-lg:hidden",
          isRunning && "lg:opacity-55",
        )}
        aria-hidden={isRunning ? true : undefined}
      >
        {sessions}
      </div>

      <FocusContinueBar />
    </>
  );
}
