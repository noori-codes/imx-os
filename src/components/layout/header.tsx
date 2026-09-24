"use client";

import Image from "next/image";
import Link from "next/link";

import { QuickCaptureTrigger } from "@/components/capture/quick-capture-trigger";
import { HeaderAccount } from "@/components/layout/header-account";
import { DeferredSearchDialog } from "@/components/search/deferred-search-dialog";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  description?: string;
  /**
   * Quiet top bar for pulse/list pages where the hero owns the display title.
   * Still shows a small page label for orientation (and keeps an accessible h1).
   */
  chrome?: boolean;
};

/** App top bar — page label + search + theme. Mobile nav lives in the tab bar. */
export function Header({ title, description, chrome = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border/40 bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/55 md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link
          href="/dashboard"
          prefetch
          className="relative size-7 shrink-0 overflow-hidden rounded-md border border-border/50 bg-foreground/5 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label="IMX OS home"
        >
          <Image
            src="/imx-logo-64.png"
            alt=""
            fill
            priority
            sizes="28px"
            className="object-cover"
          />
        </Link>

        <div className="min-w-0">
          <h1
            className={cn(
              "truncate",
              chrome
                ? "text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                : "text-lg font-semibold tracking-tight",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                "hidden truncate text-muted-foreground sm:block",
                chrome ? "mt-0.5 text-xs" : "text-sm",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <QuickCaptureTrigger />
        <DeferredSearchDialog />
        <HeaderAccount />
      </div>
    </header>
  );
}
