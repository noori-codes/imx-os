"use client";

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChartColumn,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Moon,
  NotebookPen,
  Settings,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";

import {
  matchSearchJumps,
  resolveSearchJump,
  SEARCH_JUMP_PRIMARY,
  type SearchJumpLink,
} from "@/lib/search-ui";
import { cn } from "@/lib/utils";

const JUMP_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/tasks": ListTodo,
  "/goals": Target,
  "/habits": CheckSquare,
  "/focus": Timer,
  "/notes": NotebookPen,
  "/review": Moon,
  "/calendar": Calendar,
  "/books": BookOpen,
  "/analytics": ChartColumn,
  "/settings": Settings,
};

type SearchJumpNavProps = {
  query?: string;
  /** Compact grid for ⌘K; roomy centered cards for /search */
  variant?: "page" | "palette";
  activeHref?: string | null;
  onJump?: (link: SearchJumpLink) => void;
  onHoverHref?: (href: string) => void;
  className?: string;
};

export function SearchJumpNav({
  query = "",
  variant = "page",
  activeHref = null,
  onJump,
  onHoverHref,
  className,
}: SearchJumpNavProps) {
  const trimmed = query.trim();
  const matched = trimmed
    ? new Set(matchSearchJumps(trimmed).map((link) => link.href))
    : new Set<string>();
  const resolved = trimmed ? resolveSearchJump(trimmed) : null;

  return (
    <section
      className={cn(
        "search-jump-nav",
        variant === "page" && "mx-auto w-full max-w-2xl",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-end justify-between gap-3",
          variant === "page" && "px-0.5",
          variant === "palette" && "px-1",
        )}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Jump to
          </p>
          {variant === "page" ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Spaces open instantly — type the name and press Enter
            </p>
          ) : null}
        </div>
        {resolved ? (
          <p className="shrink-0 text-[11px] text-muted-foreground">
            Enter → <span className="font-medium text-foreground">{resolved.label}</span>
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-2",
          variant === "page"
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {SEARCH_JUMP_PRIMARY.map((link, index) => {
          const Icon = JUMP_ICONS[link.href] ?? ListTodo;
          const isActive = activeHref === link.href;
          const isResolved = resolved?.href === link.href;
          const isMatched = matched.has(link.href);
          const emphasized = isActive || isResolved;

          const content = (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  emphasized
                    ? "border-transparent bg-background/15"
                    : "border-border/55 bg-muted/45",
                )}
              >
                <Icon className="size-3.5 opacity-90" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium leading-snug">
                  {link.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block truncate text-[11px] leading-snug",
                    emphasized
                      ? "text-background/70"
                      : "text-muted-foreground",
                  )}
                >
                  {link.hint}
                </span>
              </span>
            </>
          );

          const itemClass = cn(
            "search-jump-card group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-[border-color,background-color,transform,box-shadow]",
            emphasized
              ? "border-foreground/30 bg-foreground text-background shadow-sm"
              : isMatched
                ? "border-foreground/20 bg-foreground/5 text-foreground"
                : "border-surface-border bg-surface hover:-translate-y-0.5 hover:border-border hover:bg-muted/40 hover:shadow-sm",
          );

          if (onJump) {
            return (
              <button
                key={link.href}
                type="button"
                role="option"
                aria-selected={emphasized}
                style={{ ["--i" as string]: index }}
                className={itemClass}
                onMouseEnter={() => onHoverHref?.(link.href)}
                onClick={() => onJump(link)}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{ ["--i" as string]: index }}
              className={itemClass}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
