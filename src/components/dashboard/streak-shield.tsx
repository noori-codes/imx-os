"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Flame, Shield } from "lucide-react";

import { updateUserSettings } from "@/actions/settings";
import { softCompleteToast } from "@/lib/completion-payoff";
import { addDaysToDateString, toDateString, startOfDay } from "@/lib/date-utils";
import {
  computeActivityStreakWithFreezes,
  hasStreakFreezeOn,
  listStreakFreezeDates,
  markWeeklyFreezeRefillApplied,
  recordStreakFreezeDate,
  streakAtRisk,
  suggestWeeklyFreezeRefill,
} from "@/lib/streak-freezes";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";

type StreakShieldProps = {
  /** Raw activity dates (YYYY-MM-DD) with any activity */
  activeDates: string[];
  /** Server streak before freezes */
  streak: number;
  freezesRemaining: number;
  /** When true, only render if the streak needs attention. */
  riskOnly?: boolean;
};

export function StreakShield({
  activeDates,
  streak,
  freezesRemaining: initialFreezes,
  riskOnly = false,
}: StreakShieldProps) {
  const [, startTransition] = useTransition();
  const [freezes, setFreezes] = useState(initialFreezes);
  const [displayStreak, setDisplayStreak] = useState(streak);
  const [atRisk, setAtRisk] = useState(false);
  const [protectedYesterday, setProtectedYesterday] = useState(false);

  useEffect(() => {
    setFreezes(initialFreezes);
  }, [initialFreezes]);

  useEffect(() => {
    const today = toDateString(startOfDay(new Date()));
    const freezesDates = listStreakFreezeDates();
    const { current_streak } = computeActivityStreakWithFreezes(
      activeDates,
      today,
      freezesDates,
    );
    setDisplayStreak(Math.max(streak, current_streak));
    setAtRisk(streakAtRisk(activeDates, today, freezesDates));
    setProtectedYesterday(hasStreakFreezeOn(addDaysToDateString(today, -1)));
  }, [activeDates, streak]);

  useEffect(() => {
    const suggested = suggestWeeklyFreezeRefill(initialFreezes);
    if (suggested == null) return;
    let cancelled = false;
    void (async () => {
      const result = await updateUserSettings({
        streak_freezes_remaining: suggested,
      });
      if (cancelled || result.error) return;
      markWeeklyFreezeRefillApplied();
      setFreezes(suggested);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialFreezes]);

  function protectStreak() {
    if (freezes <= 0) {
      imxToast("No freezes left", {
        description: "A short focus session can repair the day.",
        tone: "default",
        actionHref: "/focus",
        actionLabel: "Open focus",
      });
      return;
    }
    const today = toDateString(startOfDay(new Date()));
    const yesterday = addDaysToDateString(today, -1);
    if (hasStreakFreezeOn(yesterday)) return;

    recordStreakFreezeDate(yesterday);
    const nextFreezes = Math.max(0, freezes - 1);
    setFreezes(nextFreezes);
    setAtRisk(false);
    setProtectedYesterday(true);
    const { current_streak } = computeActivityStreakWithFreezes(
      activeDates,
      today,
    );
    setDisplayStreak(Math.max(streak, current_streak));

    startTransition(async () => {
      const result = await updateUserSettings({
        streak_freezes_remaining: nextFreezes,
      });
      if (result.error) {
        imxToast("Couldn’t save freeze", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      softCompleteToast("Streak protected");
    });
  }

  if (displayStreak <= 0 && !atRisk) return null;
  if (riskOnly && !atRisk) return null;

  return (
    <section
      className={cn(
        "dash-alert relative overflow-hidden px-4 py-3.5 sm:px-5",
        atRisk && "dash-alert-risk",
      )}
    >
      <div className="relative z-1 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="dash-panel-eyebrow inline-flex items-center gap-1.5">
            <Flame className="size-3 opacity-70" aria-hidden />
            Streak at risk
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {displayStreak > 0
              ? `${displayStreak} day${displayStreak === 1 ? "" : "s"}`
              : "Chain broken soon"}
            {protectedYesterday ? (
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                · freeze used
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Yesterday went quiet. Protect it or repair with a short focus block.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={protectStreak}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            <Shield className="size-3.5" aria-hidden />
            Use freeze
          </button>
          <Link
            href="/focus"
            className="inline-flex h-8 items-center rounded-xl border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
          >
            Repair in focus
          </Link>
        </div>
      </div>
    </section>
  );
}
