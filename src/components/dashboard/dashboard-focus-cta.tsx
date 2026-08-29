"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  canContinueFocusSession,
  useFocusTimer,
} from "@/stores/focus-timer";
import { formatFocusDuration } from "@/types/focus";

type CtaState =
  | { kind: "idle" }
  | { kind: "live"; label: string; seconds: number }
  | { kind: "resume"; seconds: number };

function readCtaState(): CtaState {
  const s = useFocusTimer.getState();
  const canContinue = canContinueFocusSession({
    clock: s.clock,
    mode: s.mode,
    elapsedSeconds: s.elapsedSeconds,
    isRunning: s.isRunning,
    sessionStartedAt: s.sessionStartedAt,
    durationSeconds: s.durationSeconds,
    remainingSeconds: s.remainingSeconds,
    progressBaseSeconds: s.progressBaseSeconds,
  });

  if (s.isRunning) {
    if (s.clock === "up") {
      return {
        kind: "live",
        label: s.mode === "focus" ? "Live" : "Break",
        seconds: s.liveElapsedSeconds(),
      };
    }

    if (s.endsAt) {
      const remaining = Math.max(
        0,
        Math.round((s.endsAt - Date.now()) / 1000),
      );
      if (s.mode === "focus") {
        return {
          kind: "live",
          label: "Live",
          seconds: Math.max(0, s.durationSeconds - remaining),
        };
      }
      return {
        kind: "live",
        label: "Break",
        seconds: remaining,
      };
    }
  }

  if (canContinue) {
    const stopwatchSession =
      s.clock === "up" && s.elapsedSeconds > 0 ? s.elapsedSeconds : 0;
    const countdownSession =
      s.mode === "focus" && s.durationSeconds > s.remainingSeconds
        ? s.durationSeconds - s.remainingSeconds
        : 0;
    return {
      kind: "resume",
      seconds: stopwatchSession || countdownSession,
    };
  }

  return { kind: "idle" };
}

export function DashboardFocusCta() {
  const clock = useFocusTimer((s) => s.clock);
  const mode = useFocusTimer((s) => s.mode);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const elapsedSeconds = useFocusTimer((s) => s.elapsedSeconds);
  const sessionStartedAt = useFocusTimer((s) => s.sessionStartedAt);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const progressBaseSeconds = useFocusTimer((s) => s.progressBaseSeconds);
  const endsAt = useFocusTimer((s) => s.endsAt);
  const tickMs = useFocusTimer((s) => s.tickMs);

  const [cta, setCta] = useState<CtaState>({ kind: "idle" });

  useEffect(() => {
    setCta(readCtaState());
  }, [
    isRunning,
    clock,
    mode,
    elapsedSeconds,
    sessionStartedAt,
    durationSeconds,
    remainingSeconds,
    progressBaseSeconds,
    endsAt,
    tickMs,
  ]);

  useEffect(() => {
    if (!isRunning) return;

    const id = window.setInterval(() => {
      setCta(readCtaState());
    }, 1_000);
    return () => window.clearInterval(id);
  }, [
    isRunning,
    clock,
    mode,
    elapsedSeconds,
    endsAt,
    durationSeconds,
    tickMs,
  ]);

  const live = cta.kind === "live";
  const resume = cta.kind === "resume";

  return (
    <Link
      href="/focus"
      className={cn(
        "dash-focus-cta inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-[0_8px_30px_oklch(0_0_0/0.12)] dark:shadow-[0_8px_30px_oklch(0_0_0/0.45)]",
        live && "dash-focus-cta-live",
        resume && "dash-focus-cta-resume",
      )}
      data-state={cta.kind}
    >
      {live ? (
        <>
          <span
            className={cn(
              "dash-focus-live-dot",
              cta.label === "Break" && "dash-focus-live-dot-break",
            )}
            aria-hidden="true"
          />
          <span className="tabular-nums">
            {cta.label} · {formatFocusDuration(cta.seconds)}
          </span>
        </>
      ) : resume ? (
        <>
          <Play className="size-3.5 fill-current" aria-hidden="true" />
          <span className="tabular-nums">
            Resume · {formatFocusDuration(cta.seconds)}
          </span>
        </>
      ) : (
        <>
          <Timer className="size-3.5" aria-hidden="true" />
          Focus
        </>
      )}
    </Link>
  );
}
