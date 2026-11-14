"use client";

import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Tree-shakeable Motion features for client chrome.
 * Same change set: `section-reveal.tsx`, `package.json` `motion` + `@formkit/auto-animate`.
 */
export function LazyMotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
