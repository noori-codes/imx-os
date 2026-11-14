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
    <Link href={pointer.href} className="dash-continue group">
      <span className="flex min-w-0 items-center gap-3">
        <span className="dash-continue-icon">
          <Timer className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="dash-continue-label">Continue</span>
          <span className="dash-continue-title">{pointer.label}</span>
        </span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
