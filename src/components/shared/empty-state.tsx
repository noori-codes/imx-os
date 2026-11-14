"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  FolderKanban,
  ListTodo,
  Moon,
  NotebookPen,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";
import { m } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * String keys safe to pass from Server Components (no function serialization).
 * Same change set: app/(app) not-found pages, analytics/habit-streaks-list.tsx.
 */
export const EMPTY_STATE_GLYPHS = {
  alert: AlertTriangle,
  book: BookOpen,
  calendar: CalendarDays,
  check: CheckSquare,
  clock: Clock,
  folder: FolderKanban,
  list: ListTodo,
  moon: Moon,
  note: NotebookPen,
  search: Search,
  target: Target,
} as const satisfies Record<string, LucideIcon>;

export type EmptyStateGlyph = keyof typeof EMPTY_STATE_GLYPHS;

type EmptyStateProps = {
  /**
   * Client-only: pass a rendered node (e.g. `<Target className="size-5" />`).
   * Do not pass Lucide JSX from Server Components — use `glyph` instead.
   */
  icon?: ReactNode;
  /** RSC-safe icon name rendered inside this client component. */
  glyph?: EmptyStateGlyph;
  title: string;
  description?: string;
  className?: string;
  /** Dashed panel (default) matches Habits/Goals/Tasks. */
  variant?: "panel" | "plain";
  children?: ReactNode;
};

/** Shared empty surface — ink title, muted support, soft entrance. */
export function EmptyState({
  icon,
  glyph,
  title,
  description,
  className,
  variant = "panel",
  children,
}: EmptyStateProps) {
  const Glyph = glyph ? EMPTY_STATE_GLYPHS[glyph] : null;
  const resolvedIcon = icon ?? (Glyph ? <Glyph className="size-5" aria-hidden /> : null);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "imx-empty-state flex flex-col items-center justify-center px-6 text-center",
        variant === "panel"
          ? "rounded-2xl border border-dashed border-border/50 bg-foreground/[0.02] py-14"
          : "py-16",
        className,
      )}
    >
      {resolvedIcon ? (
        <m.span
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.06,
            type: "spring",
            stiffness: 380,
            damping: 22,
          }}
          className="mb-3 inline-flex size-11 items-center justify-center rounded-xl border border-border/40 bg-muted/35 text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)]"
        >
          {resolvedIcon}
        </m.span>
      ) : null}
      <h3 className="text-base font-medium tracking-tight text-foreground/90">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? (
        <m.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.32 }}
          className="w-full"
        >
          {children}
        </m.div>
      ) : null}
    </m.div>
  );
}
