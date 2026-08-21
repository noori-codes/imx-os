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
      <div
        className={cn(
          "grid items-start gap-6 transition-[grid-template-columns] duration-500 ease-out lg:gap-8",
          isRunning
            ? "lg:grid-cols-1"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(18.5rem,22rem)]",
        )}
      >
        <div
          className={cn(
            "min-w-0 transition-[max-width] duration-500 ease-out",
            isRunning && "mx-auto w-full max-w-3xl",
          )}
        >
          {timer}
        </div>

        <aside
          aria-hidden={isRunning}
          className={cn(
            "flex min-w-0 flex-col gap-4 overflow-hidden transition-all duration-500 ease-out lg:sticky lg:top-20",
            isRunning
              ? "pointer-events-none max-h-0 opacity-0 lg:max-h-none lg:w-0 lg:min-w-0 lg:opacity-0 lg:translate-x-3"
              : "max-h-[2000px] opacity-100 lg:translate-x-0",
          )}
        >
          {rail}
        </aside>
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
