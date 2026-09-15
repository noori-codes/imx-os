import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SearchHeroProps = {
  children: ReactNode;
  className?: string;
};

/** Open search chamber — title + composer nest on stage wash. */
export function SearchHero({ children, className }: SearchHeroProps) {
  return (
    <section
      className={cn(
        "search-hero relative mx-auto w-full max-w-2xl overflow-hidden py-2 sm:py-3",
        className,
      )}
    >
      <div className="search-hero-vignette" aria-hidden="true" />
      <div className="search-hero-glow" aria-hidden="true" />
      <div className="relative z-[1] space-y-5">{children}</div>
    </section>
  );
}
