"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";

type FocusWorkspaceProps = {
  timer: ReactNode;
  rail: ReactNode;
  sessions: ReactNode;
};

export function FocusWorkspace({ timer, rail, sessions }: FocusWorkspaceProps) {
  const isRunning = useFocusTimer((s) => s.isRunning);

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:gap-8">
        <div className="min-w-0">{timer}</div>

        <aside className="min-w-0 lg:sticky lg:top-20">{rail}</aside>
      </div>

      <div
        className={cn(
          "transition-opacity duration-500 ease-out",
          isRunning && "pointer-events-none opacity-35",
        )}
        aria-hidden={isRunning}
      >
        {sessions}
      </div>
    </>
  );
}
