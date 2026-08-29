"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import { DashboardHeroSky } from "@/components/dashboard/dashboard-hero-sky";
import { formatFocusMinutes } from "@/types/focus";

type DashboardHeroProps = {
  name: string;
  greeting: string;
  intent: string | null;
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

type Phase = "morning" | "afternoon" | "evening" | "night";

function phaseFromHour(hour: number): Phase {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
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

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
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

export function DashboardHero({
  name,
  greeting,
  intent,
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

  const heroKind: "due" | "focus" =
    attention > 0 ? "due" : "focus";

  const dueDisplay = useCountUp(attention, heroKind === "due");
  const focusDisplay = useCountUp(focusMinutes, heroKind === "focus");

  useEffect(() => {
    const now = new Date();
    setPhase(phaseFromHour(now.getHours()));
    setDateLabel(formatTodayLabel(now));
  }, []);

  return (
    <section
      className="dash-stage px-5 py-6 sm:px-7 sm:py-8"
      data-phase={phase}
    >
      <div className="dash-stage-glow" aria-hidden="true" />
      <div className="dash-stage-glow-secondary" aria-hidden="true" />
      <DashboardHeroSky
        sessions={focusSessions}
        focusMinutes={focusMinutes}
        emphasize={heroKind === "focus"}
      />

      <div className="relative z-[1] space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="dash-reveal min-w-0 text-center sm:text-left">
            <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              {greeting}, {name}
            </h2>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:justify-start">
              {dateLabel ? <span>{dateLabel}</span> : null}
              {streak > 0 ? (
                <>
                  <span className="text-muted-foreground/40" aria-hidden="true">
                    ·
                  </span>
                  <span className="tabular-nums">{streak}d streak</span>
                </>
              ) : null}
            </p>
            {story ? (
              <p className="mt-3 max-w-md text-sm leading-snug text-muted-foreground">
                {story}
              </p>
            ) : null}
          </div>

          <div className="dash-reveal dash-reveal-delay-1 flex justify-center sm:justify-end">
            <Link
              href="/focus"
              className="dash-focus-cta inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-[0_8px_30px_oklch(0_0_0/0.12)] dark:shadow-[0_8px_30px_oklch(0_0_0/0.45)]"
            >
              <Timer className="size-3.5" />
              Focus
            </Link>
          </div>
        </div>

        <div className="dash-reveal dash-reveal-delay-2 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
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
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                {dueToday} today · {overdue} overdue
              </p>
            ) : heroKind === "focus" && focusSessions > 0 ? (
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                {focusSessions} {focusSessions === 1 ? "star" : "stars"} lit
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:min-w-[11rem] sm:gap-8">
            {heroKind === "due" ? (
              <SecondaryStat
                label="Focus"
                value={formatFocusMinutes(focusMinutes)}
                muted={focusMinutes <= 0}
              />
            ) : (
              <SecondaryStat
                label="Due"
                value={String(attention)}
                muted={attention <= 0}
                alert={overdue > 0}
              />
            )}
            <SecondaryStat
              label="Habits"
              value={
                habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—"
              }
              muted={habitsTotal <= 0}
            />
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
}: {
  label: string;
  value: string;
  muted?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="text-center sm:text-left">
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
    </div>
  );
}
