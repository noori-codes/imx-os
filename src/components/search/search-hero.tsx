import type { ReactNode } from "react";

import { SectionReveal } from "@/components/motion/section-reveal";
import { cn } from "@/lib/utils";

type SearchHeroProps = {
  children: ReactNode;
  className?: string;
};

/** Primary search chamber — elevated vessel for title + composer. */
export function SearchHero({ children, className }: SearchHeroProps) {
  return (
    <SectionReveal emphasize>
      <section
        className={cn(
          "search-hero relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl imx-surface p-5 sm:p-7",
          className,
        )}
      >
        <div className="search-hero-vignette" aria-hidden="true" />
        <div className="search-hero-glow" aria-hidden="true" />
        <div className="relative z-[1] space-y-5">{children}</div>
      </section>
    </SectionReveal>
  );
}
