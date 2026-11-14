"use client";

import { FocusContinueBar } from "@/components/focus/focus-continue-bar";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { LazyMotionRoot } from "@/components/motion/lazy-motion-root";

/** Client-only chrome that must not block the server shell. */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotionRoot>
      <OfflineBanner />
      {children}
      <FocusContinueBar />
    </LazyMotionRoot>
  );
}
