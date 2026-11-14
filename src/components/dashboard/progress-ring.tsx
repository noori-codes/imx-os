"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  sealed?: boolean;
  featured?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Shared progress disc — draws in on mount, settles when sealed. */
export function ProgressRing({
  value,
  size = 56,
  stroke = 4,
  sealed = false,
  featured = false,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const offset = circumference * (1 - (mounted || reduceMotion ? pct : 0) / 100);

  return (
    <div
      className={cn(
        "dash-ring-draw relative inline-flex shrink-0 items-center justify-center",
        featured && "dash-ring-featured",
        sealed && "dash-ring-sealed",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="dash-ring-disc -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/70"
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.72, ease: [0.22, 1, 0.36, 1] }
          }
          className="dash-ring-fill text-foreground"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
