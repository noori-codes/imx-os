"use client";

import type { ReactNode } from "react";

import { LazyMotionRoot } from "@/components/motion/lazy-motion-root";
import { SectionReveal } from "@/components/motion/section-reveal";

/** Motion provider + soft enter for auth stage content. */
export function AuthMotionShell({ children }: { children: ReactNode }) {
  return (
    <LazyMotionRoot>
      <SectionReveal emphasize className="flex w-full flex-col items-center">
        {children}
      </SectionReveal>
    </LazyMotionRoot>
  );
}
