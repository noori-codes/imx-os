"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fireFocusGoalConfetti } from "@/lib/focus-celebrate";
import { imxToast } from "@/lib/imx-toast";
import { startOfWeek, toDateString } from "@/lib/date-utils";
import { formatFocusMinutes } from "@/types/focus";

export type WeeklyRecapStats = {
  focusMinutes: number;
  focusSessions: number;
  habitsAvgRate: number;
  bestHabitStreak: number;
  tasksCompleted: number;
  focusGoalHitDays: number;
  focusGoalDays: number;
};

function weekSealKey(date = new Date()) {
  const start = startOfWeek(date);
  return `imx-week-seal:${toDateString(start)}`;
}

function isWeekendish(date = new Date()) {
  const day = date.getDay(); // 0 Sun … 6 Sat
  return day === 0 || day === 5 || day === 6;
}

export function WeeklyRecap({
  stats,
  compact = false,
}: {
  stats: WeeklyRecapStats;
  /** Smaller CTA for dashboard nudges. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sealed, setSealed] = useState(false);
  const key = useMemo(() => weekSealKey(), []);

  useEffect(() => {
    try {
      setSealed(window.localStorage.getItem(key) === "1");
    } catch {
      setSealed(false);
    }
  }, [key]);

  const showNudge = compact ? isWeekendish() && !sealed : true;
  if (!showNudge && compact) return null;

  function sealWeek() {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    setSealed(true);
    fireFocusGoalConfetti("full");
    imxToast("Week sealed", {
      description: "Nice work — the pattern is yours.",
      tone: "success",
    });
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant={compact ? "outline" : sealed ? "outline" : "default"}
        size={compact ? "sm" : "default"}
        className={
          compact
            ? "rounded-xl border-surface-border bg-surface"
            : "rounded-xl"
        }
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3.5 opacity-80" aria-hidden />
        {sealed ? "Week recap" : compact ? "Seal the week" : "Weekly recap"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="imx-surface-float gap-0 overflow-hidden border-surface-border p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/40 px-5 pb-4 pt-5 pr-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Weekly recap
            </p>
            <DialogTitle className="mt-1.5 text-lg">
              {sealed ? "This week, sealed" : "Look what you built"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              A quiet scoreboard for the last stretch — private, just for you.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 px-5 py-5">
            <RecapStat
              label="Focus"
              value={formatFocusMinutes(stats.focusMinutes)}
              hint={`${stats.focusSessions} sessions`}
            />
            <RecapStat
              label="Goal days"
              value={`${stats.focusGoalHitDays}/${stats.focusGoalDays}`}
              hint="daily focus hit"
            />
            <RecapStat
              label="Habits"
              value={`${stats.habitsAvgRate}%`}
              hint="avg completion"
            />
            <RecapStat
              label="Streak"
              value={`${stats.bestHabitStreak}d`}
              hint={
                stats.tasksCompleted > 0
                  ? `${stats.tasksCompleted} tasks done`
                  : "best habit run"
              }
            />
          </div>

          <div className="border-t border-border/40 px-5 py-4">
            {sealed ? (
              <p className="text-center text-sm text-muted-foreground">
                Already sealed for this week. Keep going if you want.
              </p>
            ) : (
              <Button
                type="button"
                className="w-full rounded-xl"
                onClick={sealWeek}
              >
                Seal the week
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecapStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-medium tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
