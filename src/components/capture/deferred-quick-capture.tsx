"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { IMX_OPEN_CAPTURE_EVENT } from "@/lib/imx-events";

const QuickCapture = dynamic(
  () =>
    import("@/components/capture/quick-capture").then((m) => ({
      default: m.QuickCapture,
    })),
  { ssr: false, loading: () => null },
);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function hasOpenModal() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], [data-slot="dialog-content"][data-state="open"]',
    ),
  );
}

/** Mount capture after idle; still wake immediately on C / open event. */
export function DeferredQuickCapture() {
  const [ready, setReady] = useState(false);
  const [bootOpen, setBootOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let mounted = false;

    function enable(open = false) {
      if (cancelled) return;
      if (open) setBootOpen(true);
      setReady(true);
      mounted = true;
    }

    function onOpenEvent() {
      enable(true);
    }

    function onKey(event: KeyboardEvent) {
      if (mounted) return;
      if (event.key !== "c" && event.key !== "C") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (hasOpenModal()) return;
      if (document.documentElement.dataset.focusSession === "true") return;

      event.preventDefault();
      enable(true);
    }

    window.addEventListener(IMX_OPEN_CAPTURE_EVENT, onOpenEvent);
    window.addEventListener("keydown", onKey);

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      idleId = ric.call(window, () => enable(false), { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(() => enable(false), 800);
    }

    return () => {
      cancelled = true;
      window.removeEventListener(IMX_OPEN_CAPTURE_EVENT, onOpenEvent);
      window.removeEventListener("keydown", onKey);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <QuickCapture initialOpen={bootOpen} />;
}
