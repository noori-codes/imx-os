"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DeferredSearchDialog } from "@/components/search/deferred-search-dialog";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  description?: string;
  /**
   * Chrome-only bar for pulse/list pages where the hero owns the title.
   * Keeps an accessible page name for screen readers.
   */
  chrome?: boolean;
};

/** App top bar — search + theme. Mobile nav lives in the tab bar. */
export function Header({ title, description, chrome = false }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6",
        chrome ? "justify-end" : "justify-between",
      )}
    >
      <div className={cn("min-w-0", chrome && "sr-only")}>
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="hidden truncate text-sm text-muted-foreground sm:block">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DeferredSearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
