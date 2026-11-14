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
 * Minimize exits theater and restores the inline session layout + chrome.
 *
 * Same change set: `layout/focus-chrome-sync.tsx`, `focus-workspace.tsx`,
 * and `html[data-focus-theater]` rules in `globals.css`.
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

  // Keep the screen awake while a session is running (theater or inline).
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

  // Exit theater: restore sidebar/header and show the player inline.
  if (minimized) {
    return (
      <div className="focus-theater-inline relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="relative z-1 flex shrink-0 items-center justify-end gap-1.5 px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-border/40 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Enter focus theater"
            title="Enter theater"
          >
            <Maximize2 className="size-4" />
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
      <div className="pointer-events-none absolute inset-0 focus-theater-wash" aria-hidden />
      <div className="relative z-1 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Focus theater
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-border/40 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Exit theater to page"
            title="Minimize (Esc)"
          >
            <Minimize2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isRunning) pause();
              setMinimized(true);
            }}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-border/40 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Pause and exit theater"
            title="Exit theater"
          >
            <X className="size-4" />
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
