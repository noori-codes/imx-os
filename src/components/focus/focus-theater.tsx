"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, X } from "lucide-react";

import { focusSceneForTrack, useFocusSound } from "@/stores/focus-sound";
import { useFocusTimer } from "@/stores/focus-timer";

type FocusTheaterProps = {
  children: ReactNode;
  /** When false, renders children in-place (idle studio). */
  active: boolean;
};

/**
 * Full-viewport distraction-free stage. Portals above app chrome and
 * marks html[data-focus-theater] so sidebar/header/tabs hide via CSS.
 */
export function FocusTheater({ children, active }: FocusTheaterProps) {
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const pause = useFocusTimer((s) => s.pause);
  const soundId = useFocusSound((s) => s.activeId);
  const scene = focusSceneForTrack(soundId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) setMinimized(false);
  }, [active]);

  useEffect(() => {
    if (!active || minimized) {
      delete document.documentElement.dataset.focusTheater;
      return;
    }
    document.documentElement.dataset.focusTheater = "true";
    return () => {
      delete document.documentElement.dataset.focusTheater;
    };
  }, [active, minimized]);

  useEffect(() => {
    if (!active || minimized) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMinimized(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, minimized]);

  useEffect(() => {
    if (!active || !isRunning) return;
    let lock: WakeLockSentinel | null = null;

    void (async () => {
      try {
        if (!("wakeLock" in navigator)) return;
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* unsupported / denied */
      }
    })();

    return () => {
      void lock?.release();
    };
  }, [active, isRunning]);

  if (!active) return <>{children}</>;

  if (minimized) {
    return (
      <div className="focus-theater-inline relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="focus-theater-chrome relative z-1 flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Session · page
          </p>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/50 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Enter focus theater"
            title="Enter theater"
          >
            <Maximize2 className="size-3.5" />
            Theater
          </button>
        </div>
        <div className="relative z-1 flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="focus-theater-fallback flex min-h-svh flex-1 flex-col">
        {children}
      </div>
    );
  }

  return createPortal(
    <div
      className="focus-theater fixed inset-0 z-40 flex flex-col bg-background"
      data-focus-scene={scene}
      role="dialog"
      aria-modal="true"
      aria-label="Focus theater"
    >
      <div
        className="pointer-events-none absolute inset-0 focus-theater-wash"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 focus-theater-glow" aria-hidden />
      <div className="focus-theater-chrome pointer-events-none absolute inset-x-0 top-0 z-2 flex items-start justify-end gap-2 px-5 py-4 sm:px-8">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/40 bg-background/40 px-3 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Exit theater to page"
            title="Minimize (Esc)"
          >
            <Minimize2 className="size-3.5" />
            Page
          </button>
          <button
            type="button"
            onClick={() => {
              if (isRunning) pause();
              setMinimized(true);
            }}
            className="inline-flex size-8 items-center justify-center rounded-full border border-border/40 bg-background/40 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Pause and exit theater"
            title="Pause and exit"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="relative z-1 flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>,
    document.body,
  );
}
