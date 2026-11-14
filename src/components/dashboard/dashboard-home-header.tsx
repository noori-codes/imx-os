"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Moon } from "lucide-react";

import { DashboardFocusCta } from "@/components/dashboard/dashboard-focus-cta";
import { SectionReveal } from "@/components/motion/section-reveal";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardHomeHeaderProps = {
  name: string;
  greeting: string;
  intent: string | null;
  hasTodayReview: boolean;
  dueOpen: number;
  overdue: number;
  habitsDone: number;
  habitsTotal: number;
  focusMinutes: number;
  streak: number;
};

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Masthead — date + greeting + metric rail + CTAs.
 * Flat ink desk: no hero wash, hairline metrics.
 *
 * Graphite dashboard set: `dashboard-stage`, `dashboard-atmosphere`,
 * `dashboard-quick-actions`, `dashboard-spotlight`, `dashboard-focus-meter`,
 * `habits-today`, `today-focus`, `week-overview`, plus `dash-*` in `globals.css`.
 */
export function DashboardHomeHeader({
  name,
  greeting,
  intent,
  hasTodayReview,
  dueOpen,
  overdue,
  habitsDone,
  habitsTotal,
  focusMinutes,
  streak,
}: DashboardHomeHeaderProps) {
  const [dateLabel, setDateLabel] = useState("");
  const story = intent?.trim() || null;

  useEffect(() => {
    setDateLabel(formatTodayLabel());
  }, []);

  return (
    <SectionReveal emphasize>
      <header className="dash-masthead">
        <div className="dash-masthead-top">
          <div className="min-w-0 flex-1">
            <p className="dash-masthead-meta">
              <span suppressHydrationWarning>{dateLabel || "\u00a0"}</span>
              {streak > 0 ? (
                <>
                  <span className="dash-masthead-dot" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-foreground/80">
                    <Flame className="size-3 opacity-65" aria-hidden />
                    {streak}d
                  </span>
                </>
              ) : null}
            </p>
            <h2 className="dash-masthead-title">
              {greeting}, {name}
            </h2>
            <p className="dash-masthead-story">
              {story || "Here’s what needs you today."}
            </p>
          </div>

          <div className="dash-masthead-actions">
            <DashboardFocusCta />
            <Link
              href="/review"
              className={cn(
                "dash-masthead-secondary",
                hasTodayReview && "dash-masthead-secondary-muted",
              )}
            >
              <Moon className="size-3.5 opacity-70" aria-hidden />
              {hasTodayReview ? "Reviewed" : "Review"}
            </Link>
          </div>
        </div>

        <dl className="dash-metric-rail">
          <div className="dash-metric">
            <dt>Tasks</dt>
            <dd className={cn(overdue > 0 && "text-destructive")}>
              {dueOpen > 0 ? dueOpen : "—"}
              {overdue > 0 ? (
                <span className="dash-metric-hint text-destructive/80">
                  {overdue} overdue
                </span>
              ) : null}
            </dd>
          </div>
          <div className="dash-metric">
            <dt>Habits</dt>
            <dd>
              {habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—"}
            </dd>
          </div>
          <div className="dash-metric">
            <dt>Focus</dt>
            <dd>
              {focusMinutes > 0 ? formatFocusMinutes(focusMinutes) : "—"}
            </dd>
          </div>
        </dl>
      </header>
    </SectionReveal>
  );
}
