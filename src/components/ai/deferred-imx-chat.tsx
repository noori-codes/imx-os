"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ImxChat = dynamic(
  () =>
    import("@/components/ai/imx-chat").then((m) => ({
      default: m.ImxChat,
    })),
  { ssr: false, loading: () => null },
);

/** Mount the coach after idle so it doesn’t compete with first paint. */
export function DeferredImxChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    function enable() {
      if (!cancelled) setReady(true);
    }

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      idleId = ric.call(window, enable, { timeout: 3500 });
    } else {
      timeoutId = window.setTimeout(enable, 1500);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <ImxChat />;
}
