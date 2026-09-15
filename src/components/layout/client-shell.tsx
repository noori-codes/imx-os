"use client";

import { FocusContinueBar } from "@/components/focus/focus-continue-bar";
import { OfflineBanner } from "@/components/layout/offline-banner";

/** Client-only chrome that must not block the server shell. */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
      <FocusContinueBar />
    </>
  );
}
