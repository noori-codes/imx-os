"use client";

import Link from "next/link";
import { Flame, Moon } from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardFocusCta } from "@/components/dashboard/dashboard-focus-cta";
import { DashboardHeroSky } from "@/components/dashboard/dashboard-hero-sky";
import {
  dashboardPhaseFromHour,
  type DashboardPhase,
} from "@/lib/dashboard-phase";
import { streakSeasonFor } from "@/lib/streak-seasons";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardHeroProps = {
  name: string;
  greeting: string;
  intent: string | null;
  /** True when today’s daily review is already sealed. */
  hasTodayReview?: boolean;
  dueToday: number;
  overdue: number;
  focusMinutes: number;
  focusSessions: number;
  habitsDone: number;
  habitsTotal: number;
  streak: number;
  /** Live due + overdue; falls back to dueToday + overdue when omitted. */
  attention?: number;
};

type Phase = DashboardPhase;

const PHASE_LABEL: Record<Phase, string> = {
  morning: "Morning light",
  afternoon: "Afternoon calm",
  evening: "Evening hush",
  night: "Night room",
};

function phaseFromHour(hour: number): Phase {
  return dashboardPhaseFromHour(hour);
}

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled || target <= 0) {
      setValue(target);
      return;
    }

    let frame = 0;
    const duration = 620;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  return value;
}

function streakTier(streak: number) {
  if (streak <= 0) return "none";
  if (streak < 3) return "low";
  if (streak < 7) return "warm";
  if (streak < 14) return "hot";
  return "milestone";
}

export function DashboardHero({
  name,
  greeting,
  intent,
  hasTodayReview = false,
  dueToday,
  overdue,
  focusMinutes,
  focusSessions,
  habitsDone,
  habitsTotal,
  streak,
  attention: attentionOverride,
}: DashboardHeroProps) {
  const [phase, setPhase] = useState<Phase>("afternoon");
  const [dateLabel, setDateLabel] = useState("");
  const attention = attentionOverride ?? dueToday + overdue;
  const story = intent?.trim() || null;

  const heroKind: "due" | "focus" = attention > 0 ? "due" : "focus";

  const dueDisplay = useCountUp(attention, heroKind === "due");
  const focusDisplay = useCountUp(focusMinutes, heroKind === "focus");
  const streakDisplay = useCountUp(streak, streak > 0);
  const streakLevel = streakTier(streak);

  useEffect(() => {
    const now = new Date();
    setPhase(phaseFromHour(now.getHours()));
    setDateLabel(formatTodayLabel(now));
  }, []);

  return (
    <section
      className="dash-stage dash-stage-hero px-6 py-9 sm:px-9 sm:py-11 lg:px-11 lg:py-12"
      data-phase={phase}
    >
      <DashboardHeroSky
        sessions={focusSessions}
        focusMinutes={focusMinutes}
        emphasize={heroKind === "focus"}
      />

      <div className="relative z-[2] flex min-h-[min(44vh,23rem)] flex-col justify-between gap-12 sm:min-h-[25rem] sm:gap-14">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="dash-reveal min-w-0 max-w-xl text-center sm:text-left">
            <p className="dash-hero-eyebrow">
              <span>{PHASE_LABEL[phase]}</span>
              {dateLabel ? (
                <>
                  <span className="text-muted-foreground/35" aria-hidden>
                    ·
                  </span>
                  <span>{dateLabel}</span>
                </>
              ) : null}
            </p>
            <h2 className="dash-hero-greeting mt-3.5 text-[1.85rem] font-medium text-foreground sm:mt-4 sm:text-[2.35rem]">
              {greeting}, {name}
            </h2>
            {story ? (
              <p className="dash-hero-story mt-3.5 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground/85">
                {story}
              </p>
            ) : (
              <p className="dash-hero-story mt-3.5 max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground/60">
                One clear room for what matters today.
              </p>
            )}
          </div>

          <div className="dash-reveal dash-reveal-delay-1 flex flex-col items-center gap-2.5 sm:items-end">
            {streak >= 7 ? (
              <StreakPill streak={streakDisplay} tier={streakLevel} />
            ) : null}
            <div className="dash-hero-cta-wrap flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <DashboardFocusCta />
              {hasTodayReview ? (
                <Link
                  href="/review"
                  className="dash-hero-secondary-cta inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  <Moon className="size-3.5 opacity-70" aria-hidden="true" />
                  Reviewed
                </Link>
              ) : phase === "evening" || phase === "night" || !story ? (
                <Link
                  href="/review"
                  className="dash-hero-secondary-cta inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:border-border/60 hover:bg-surface-strong"
                >
                  <Moon className="size-3.5 opacity-70" aria-hidden="true" />
                  Review
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="dash-reveal dash-reveal-delay-2 flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between sm:gap-14">
          <div className="relative text-center sm:text-left">
            <p className="dash-hero-label">
              {heroKind === "due" ? "Needs you" : "Focus today"}
            </p>
            <p
              className={cn(
                "dash-hero-stat",
                heroKind === "due" && attention > 0
                  ? overdue > 0
                    ? "text-destructive"
                    : "text-foreground"
                  : focusMinutes > 0
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {heroKind === "due"
                ? dueDisplay
                : formatFocusMinutes(focusDisplay)}
            </p>
            {heroKind === "due" && overdue > 0 ? (
              <p className="mt-3 text-[0.7rem] tabular-nums tracking-[0.08em] text-muted-foreground/80">
                {dueToday} today · {overdue} overdue
              </p>
            ) : heroKind === "focus" && focusSessions > 0 ? (
              <p className="mt-3 text-[0.7rem] tabular-nums tracking-[0.08em] text-muted-foreground/80">
                {focusSessions} {focusSessions === 1 ? "star" : "stars"} lit
              </p>
            ) : null}
          </div>

          <div className="dash-hero-instrument grid grid-cols-3 gap-6 sm:min-w-[18rem] sm:gap-8">
            {heroKind === "due" ? (
              <SecondaryStat
                label="Focus"
                value={formatFocusMinutes(focusMinutes)}
                muted={focusMinutes <= 0}
                href="/focus"
              />
            ) : (
              <SecondaryStat
                label="Due"
                value={String(attention)}
                muted={attention <= 0}
                alert={overdue > 0}
                href="/tasks"
              />
            )}
            <SecondaryStat
              label="Habits"
              value={habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—"}
              muted={habitsTotal <= 0}
              href="/habits"
            />
            <StreakStat streak={streakDisplay} tier={streakLevel} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SecondaryStat({
  label,
  value,
  muted,
  alert,
  href,
}: {
  label: string;
  value: string;
  muted?: boolean;
  alert?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <p className="dash-hero-secondary-label">{label}</p>
      <p
        className={cn(
          "dash-hero-secondary-value",
          alert
            ? "text-destructive"
            : muted
              ? "text-muted-foreground"
              : "text-foreground",
        )}
      >
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block text-center transition-opacity hover:opacity-80 sm:text-left"
      >
        {body}
      </Link>
    );
  }

  return <div className="text-center sm:text-left">{body}</div>;
}

function StreakStat({
  streak,
  tier,
}: {
  streak: number;
  tier: ReturnType<typeof streakTier>;
}) {
  const active = streak > 0;

  return (
    <div
      className={cn(
        "dash-hero-streak text-center sm:text-left",
        active && "dash-hero-streak-active",
      )}
      data-tier={active ? tier : "none"}
    >
      <p className="dash-hero-streak-label">
        <Flame className="size-3 shrink-0" aria-hidden="true" />
        <span>Streak</span>
      </p>
      <p className="dash-hero-streak-value tabular-nums">
        {active ? `${streak}d` : "—"}
      </p>
    </div>
  );
}

function StreakPill({
  streak,
  tier,
}: {
  streak: number;
  tier: ReturnType<typeof streakTier>;
}) {
  const season = streakSeasonFor(streak);
  return (
    <div className="dash-hero-streak-pill" data-tier={tier}>
      <Flame className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="tabular-nums">
        {streak}d{season ? ` · ${season.label}` : " streak"}
      </span>
    </div>
  );
}
