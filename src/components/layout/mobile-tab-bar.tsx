"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MOBILE_MORE_ITEMS,
  MOBILE_TAB_ITEMS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar() {
  const pathname = usePathname();
  const isRunning = useFocusTimer((s) => s.isRunning);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MOBILE_MORE_ITEMS.some((item) =>
    isActivePath(pathname, item.href),
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  if (isRunning) return null;

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "mobile-tab-bar fixed inset-x-0 bottom-0 z-30 md:hidden",
          "border-t border-border/40 bg-background/90 backdrop-blur-md",
          "supports-[backdrop-filter]:bg-background/70",
        )}
      >
        <div className="mobile-tab-bar-inner grid grid-cols-5">
          {MOBILE_TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mobile-tab-item relative flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium tracking-wide transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 top-0 h-0.5 rounded-full bg-foreground transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn("size-[1.15rem]", active && "opacity-100")}
                  strokeWidth={active ? 2.25 : 1.9}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-controls="mobile-more-sheet"
            className={cn(
              "mobile-tab-item relative flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium tracking-wide transition-colors",
              moreActive || moreOpen
                ? "text-foreground"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-3 top-0 h-0.5 rounded-full bg-foreground transition-opacity",
                moreActive || moreOpen ? "opacity-100" : "opacity-0",
              )}
            />
            <Ellipsis
              className="size-[1.15rem]"
              strokeWidth={moreActive || moreOpen ? 2.25 : 1.9}
            />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          id="mobile-more-sheet"
          side="bottom"
          className="rounded-t-2xl border-border/60 px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
        >
          <div
            className="mx-auto mb-1 h-1 w-10 rounded-full bg-border/80"
            aria-hidden
          />
          <SheetHeader className="px-5 pb-2 text-left">
            <SheetTitle className="text-base font-semibold tracking-tight">
              More
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Spaces beyond the tab bar, plus Search.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            <Link
              href="/tasks?compose=1"
              onClick={() => setMoreOpen(false)}
              className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Add task
            </Link>
            <Link
              href="/calendar?compose=1"
              onClick={() => setMoreOpen(false)}
              className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              Add event
            </Link>
            <Link
              href="/habits?compose=1"
              onClick={() => setMoreOpen(false)}
              className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              Add habit
            </Link>
          </div>
          <nav className="flex flex-col gap-0.5 px-2 pb-2" aria-label="More">
            {MOBILE_MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  <span className="min-w-0 flex-1">
                    <span className="block">{item.title}</span>
                    <span className="block text-xs text-muted-foreground/80">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
