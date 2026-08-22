"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/date-utils";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  formatFocusClock,
  formatFocusMinutes,
  type FocusOverviewStats,
} from "@/types/focus";

type FocusStatsProps = {
  stats: FocusOverviewStats;
};

function yesterdayWhisper(todayMinutes: number, yesterdayMinutes: number) {
  if (todayMinutes === 0 && yesterdayMinutes === 0) {
    return "Even with yesterday · still early";
  }
  if (todayMinutes === 0 && yesterdayMinutes > 0) {
    return `Yesterday held ${formatFocusMinutes(yesterdayMinutes)}`;
  }
  if (yesterdayMinutes === 0 && todayMinutes > 0) {
    return "Ahead of a quiet yesterday";
  }

  const delta = todayMinutes - yesterdayMinutes;
  if (delta === 0) return "Matched yesterday";
  if (delta > 0) return `+${formatFocusMinutes(delta)} vs yesterday`;
  return `${formatFocusMinutes(Math.abs(delta))} quieter than yesterday`;
}

/** Map clock time onto a sky arc (dawn left → night right). */
function constellationPoint(startedAt: string) {
  const date = new Date(startedAt);
  const hours = date.getHours() + date.getMinutes() / 60;
  const dayStart = 5;
  const dayEnd = 23;
  const t = Math.min(1, Math.max(0, (hours - dayStart) / (dayEnd - dayStart)));
  const angle = Math.PI - t * Math.PI;
  const cx = 50;
  const cy = 58;
  const r = 36;
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
    t,
  };
}

function markRadius(minutes: number) {
  if (minutes >= 90) return 2.4;
  if (minutes >= 50) return 2;
  if (minutes >= 25) return 1.65;
  return 1.25;
}

function formatMarkTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextHonestBlock({
  remaining,
  met,
  blockMinutes,
  todayMinutes,
}: {
  remaining: number;
  met: boolean;
  blockMinutes: number;
  todayMinutes: number;
}) {
  const block = Math.max(1, blockMinutes);

  if (met) {
    return "Goal sealed · another block is bonus";
  }
  if (todayMinutes <= 0) {
    return "Goal is open — begin when ready";
  }
  if (remaining <= block) {
    return `One more ${formatFocusMinutes(block)} seals the goal`;
  }

  const blocks = Math.ceil(remaining / block);
  return `${blocks} honest blocks to goal · begin when ready`;
}

function readGoalMinutes() {
  if (typeof window === "undefined") return FOCUS_DAILY_GOAL_DEFAULT;
  const raw = window.localStorage.getItem(FOCUS_DAILY_GOAL_KEY);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 15 || value > 12 * 60) {
    return FOCUS_DAILY_GOAL_DEFAULT;
  }
  return Math.round(value);
}

export function FocusStats({ stats }: FocusStatsProps) {
  const lastFocusSeconds = useFocusTimer((s) => s.lastFocusSeconds);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const mode = useFocusTimer((s) => s.mode);
  const clock = useFocusTimer((s) => s.clock);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const liveElapsedSeconds = useFocusTimer((s) => {
    void s.tickMs;
    return s.liveElapsedSeconds();
  });
  const [goalMinutes, setGoalMinutes] = useState(FOCUS_DAILY_GOAL_DEFAULT);
  const [ready, setReady] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    setGoalMinutes(readGoalMinutes());
    setReady(true);
  }, []);

  function updateGoal(minutes: number) {
    setGoalMinutes(minutes);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(minutes));
    setGoalOpen(false);
  }

  const stopwatchLive = clock === "up" && liveElapsedSeconds > 0;
  const countdownLive =
    isRunning &&
    mode === "focus" &&
    durationSeconds > remainingSeconds;
  const liveFocus = stopwatchLive || countdownLive;
  const liveExtraMinutes = liveFocus
    ? clock === "up"
      ? Math.max(0, Math.floor(liveElapsedSeconds / 60))
      : Math.max(0, Math.floor((durationSeconds - remainingSeconds) / 60))
    : 0;
  const focusMinutes = stats.focus_minutes + liveExtraMinutes;

  const progress = Math.min(
    100,
    (focusMinutes / Math.max(goalMinutes, 1)) * 100,
  );
  const remaining = Math.max(0, goalMinutes - focusMinutes);
  const met = focusMinutes >= goalMinutes;
  const blockMinutes = Math.max(1, Math.round(lastFocusSeconds / 60));
  const honestBlock = ready
    ? liveFocus
      ? !isRunning && stopwatchLive
        ? "Paused · seal to save this block"
        : remaining <= 0
          ? "Sealing the goal · stay with it"
          : `${formatFocusMinutes(remaining)} still open · keep going`
      : nextHonestBlock({
          remaining,
          met,
          blockMinutes,
          todayMinutes: focusMinutes,
        })
    : null;
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = toDateString(yesterdayDate);
  const yesterdayMinutes =
    stats.week.find((day) => day.date === yesterdayKey)?.minutes ?? 0;
  const vsYesterday = yesterdayWhisper(focusMinutes, yesterdayMinutes);
  const marks = stats.today_marks ?? [];

  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - (ready ? progress : 0) / 100);

  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <section
      data-live={liveFocus ? "true" : "false"}
      className="focus-progress relative flex min-h-[34rem] flex-col overflow-hidden sm:min-h-[40rem]"
    >
      <div className="focus-progress-glow" aria-hidden />

      <div className="relative z-[1] flex flex-1 flex-col">
        <div className="text-center lg:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Today
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {liveFocus
              ? isRunning
                ? "Session live"
                : "Session paused"
              : weekday}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <div className="relative flex size-[13.5rem] items-center justify-center sm:size-[15rem]">
            <svg
              className="focus-progress-ring absolute inset-0 size-full -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                className="stroke-muted/45"
                strokeWidth="1"
              />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                className="stroke-muted/70"
                strokeWidth="2.5"
                strokeDasharray="1.1 2.2"
                opacity={0.35}
              />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                className="focus-progress-arc stroke-foreground transition-[stroke-dashoffset] duration-700 ease-out"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>

            <div
              className="relative px-4 text-center"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={goalMinutes}
              aria-valuenow={Math.min(focusMinutes, goalMinutes)}
              aria-label="Daily focus goal progress"
            >
              <p className="focus-clock text-[2.35rem] text-foreground sm:text-[2.75rem]">
                {formatFocusMinutes(focusMinutes)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {liveFocus
                  ? clock === "up"
                    ? liveElapsedSeconds >= 60
                      ? `Live · +${formatFocusMinutes(Math.round(liveElapsedSeconds / 60))}`
                      : `Live · +${formatFocusClock(liveElapsedSeconds)}`
                    : liveExtraMinutes > 0
                      ? `Live · +${formatFocusMinutes(liveExtraMinutes)}`
                      : "Live · just started"
                  : stats.sessions === 0
                    ? "No sessions yet"
                    : `${stats.sessions} session${stats.sessions === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-[16rem] text-center text-sm text-muted-foreground">
            {vsYesterday}
          </p>

          <div className="mt-4 max-w-[16rem] text-center">
            <p className="text-sm text-foreground/85">
              {honestBlock ?? "Loading goal…"}
            </p>
            <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
              {ready ? (
                met ? (
                  <>
                    {formatFocusMinutes(focusMinutes)} /{" "}
                    {formatFocusMinutes(goalMinutes)}
                  </>
                ) : (
                  <>
                    {formatFocusMinutes(remaining)} left ·{" "}
                    {formatFocusMinutes(goalMinutes)} goal
                  </>
                )
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => setGoalOpen((value) => !value)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground/80 transition-colors hover:text-foreground"
              aria-expanded={goalOpen}
            >
              Change goal
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  goalOpen && "rotate-180",
                )}
              />
            </button>

            {goalOpen ? (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {FOCUS_DAILY_GOAL_PRESETS.map((preset) => {
                  const active = goalMinutes === preset.minutes;
                  return (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => updateGoal(preset.minutes)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] tabular-nums transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Constellation
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {marks.length === 0
                  ? "Clear sky"
                  : `${marks.length} lit`}
              </p>
            </div>

            <div
              className="relative mx-auto w-full max-w-[17rem]"
              aria-label="Today's focus sessions by time of day"
            >
              <svg viewBox="0 0 100 72" className="h-auto w-full">
                <path
                  d="M 14 58 A 36 36 0 0 1 86 58"
                  fill="none"
                  className="stroke-border/60"
                  strokeWidth="0.7"
                  strokeDasharray="1.2 1.8"
                />
                <text
                  x="12"
                  y="68"
                  className="fill-muted-foreground"
                  fontSize="3.2"
                >
                  Dawn
                </text>
                <text
                  x="44"
                  y="68"
                  className="fill-muted-foreground"
                  fontSize="3.2"
                  textAnchor="middle"
                >
                  Noon
                </text>
                <text
                  x="88"
                  y="68"
                  className="fill-muted-foreground"
                  fontSize="3.2"
                  textAnchor="end"
                >
                  Night
                </text>

                {marks.length === 0 ? (
                  <circle
                    cx="50"
                    cy="40"
                    r="0.9"
                    className="fill-muted-foreground/35"
                  />
                ) : (
                  marks.map((mark) => {
                    const point = constellationPoint(mark.started_at);
                    const r = markRadius(mark.minutes);
                    return (
                      <g key={mark.started_at + mark.minutes}>
                        <title>
                          {formatMarkTime(mark.started_at)} ·{" "}
                          {formatFocusMinutes(mark.minutes)}
                        </title>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={r + 1.1}
                          className="fill-foreground/10"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={r}
                          className="fill-foreground"
                        />
                      </g>
                    );
                  })
                )}
              </svg>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Streak{" "}
              <span className="tabular-nums text-foreground">
                {stats.current_streak}d
              </span>
              {stats.longest_streak > 0
                ? ` · best ${stats.longest_streak}d`
                : ""}
            </span>
            <span className="tabular-nums">
              {marks.length === 0
                ? "Plot the first star"
                : "Day taking shape"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
