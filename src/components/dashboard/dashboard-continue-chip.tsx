"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";

import {
  readContinuePointer,
  type ImxContinuePointer,
} from "@/lib/imx-continue";

export function DashboardContinueChip() {
  const [pointer, setPointer] = useState<ImxContinuePointer | null>(null);

  useEffect(() => {
    function refresh() {
      setPointer(readContinuePointer());
    }
    refresh();
    window.addEventListener("imx:continue-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("imx:continue-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!pointer) return null;

  return (
    <Link
      href={pointer.href}
      className="dash-reveal group flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface px-4 py-3 transition-colors hover:border-border hover:bg-surface-strong"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-foreground">
          <Timer className="size-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Continue
          </span>
          <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
            {pointer.label}
          </span>
        </span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
