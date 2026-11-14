"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Slightly stronger lift for hero/pulse panels. */
  emphasize?: boolean;
};

/** Soft enter for section heroes and panels — respects reduced motion. */
export function SectionReveal({
  children,
  className,
  delay = 0,
  emphasize = false,
}: SectionRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: emphasize ? 12 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: emphasize ? 0.48 : 0.36,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </m.div>
  );
}

type StaggerListProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Parent for staggered children using Motion variants. */
export function StaggerList({
  children,
  className,
  delay = 0,
}: StaggerListProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.045,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </m.div>
  );
}
