"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Lightweight connectivity banner — no service worker, just honest status.
 */
export function OfflineBanner() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [flashOnline, setFlashOnline] = useState(false);

  useEffect(() => {
    function goOffline() {
      setOffline(true);
      setFlashOnline(false);
    }

    function goOnline() {
      setOffline(false);
      setFlashOnline(true);
    }

    setOffline(!navigator.onLine);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!flashOnline) return;
    const timer = window.setTimeout(() => setFlashOnline(false), 4000);
    return () => window.clearTimeout(timer);
  }, [flashOnline]);

  if (!offline && !flashOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-14 z-40 flex justify-center px-3 md:top-3",
        offline ? "pointer-events-none" : "pointer-events-auto",
      )}
    >
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md",
          offline
            ? "border-destructive/25 bg-destructive/10 text-destructive"
            : "border-border/60 bg-card/90 text-foreground",
        )}
      >
        {offline ? <WifiOff className="size-3.5 shrink-0" /> : null}
        {offline ? (
          "You’re offline — changes may not save"
        ) : (
          <>
            <span>Back online</span>
            <button
              type="button"
              onClick={() => {
                router.refresh();
                setFlashOnline(false);
              }}
              className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold tracking-wide text-background transition-opacity hover:opacity-90"
            >
              Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
}
