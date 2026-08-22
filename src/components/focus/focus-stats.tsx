"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Moon, Sun, Sunrise } from "lucide-react";

import { useDocumentVisible } from "@/hooks/use-document-visible";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/date-utils";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  formatFocusDuration,
  formatFocusMinutes,
  type FocusTodayMark,
  type FocusOverviewStats,
} from "@/types/focus";

type FocusStatsProps = {
  stats: FocusOverviewStats;
};

const ARC = { cx: 50, cy: 58, r: 36 };

function arcPoint(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const angle = Math.PI - clamped * Math.PI;
  return {
    x: ARC.cx + ARC.r * Math.cos(angle),
    y: ARC.cy - ARC.r * Math.sin(angle),
    t: clamped,
  };
}

function constellationPoint(startedAt: string) {
  const date = new Date(startedAt);
  const hours = date.getHours() + date.getMinutes() / 60;
  const dayStart = 5;
  const dayEnd = 23;
  const t = Math.min(1, Math.max(0, (hours - dayStart) / (dayEnd - dayStart)));
  return arcPoint(t);
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

function readGoalMinutes() {
  if (typeof window === "undefined") return FOCUS_DAILY_GOAL_DEFAULT;
  const raw = window.localStorage.getItem(FOCUS_DAILY_GOAL_KEY);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 15 || value > 12 * 60) {
    return FOCUS_DAILY_GOAL_DEFAULT;
  }
  return Math.round(value);
}

function heroMotivator({
  met,
  goalRemainingSeconds,
  focusMinutes,
  yesterdayMinutes,
  weekMinutes,
  goalLabel,
}: {
  met: boolean;
  goalRemainingSeconds: number;
  focusMinutes: number;
  yesterdayMinutes: number;
  weekMinutes: number[];
  goalLabel: string;
}) {
  if (met) {
    return { headline: "Goal sealed", sub: "Room for more if you want it" };
  }
  if (focusMinutes === 0) {
    return { headline: goalLabel, sub: "ahead today" };
  }
  const weekBest = Math.max(0, ...weekMinutes);
  if (weekBest > 0 && focusMinutes >= weekBest) {
    return { headline: "Best day", sub: "this week so far" };
  }
  if (yesterdayMinutes > 0 && focusMinutes < yesterdayMinutes) {
    const gap = yesterdayMinutes - focusMinutes;
    return {
      headline: formatFocusMinutes(Math.max(1, gap)),
      sub: "to beat yesterday",
    };
  }
  return {
    headline: formatFocusDuration(goalRemainingSeconds),
    sub: "to goal",
  };
}

function smartWhisper({
  marks,
  focusMinutes,
  goalMinutes,
  yesterdayMinutes,
  blockMinutes,
  met,
  goalLabel,
}: {
  marks: FocusTodayMark[];
  focusMinutes: number;
  goalMinutes: number;
  yesterdayMinutes: number;
  blockMinutes: number;
  met: boolean;
  goalLabel: string;
}) {
  if (met) return "Another honest block is pure bonus";
  if (marks.length >= 2) {
    return `${marks.length} stars lit · pacing toward ${goalLabel}`;
  }
  if (
    yesterdayMinutes > 0 &&
    focusMinutes > 0 &&
    focusMinutes + blockMinutes > yesterdayMinutes
  ) {
    return `One more ${formatFocusMinutes(blockMinutes)} beats yesterday`;
  }
  if (focusMinutes === 0) return "First star is one session away";
  const remaining = Math.max(0, goalMinutes - focusMinutes);
  if (remaining <= blockMinutes) {
    return `One ${formatFocusMinutes(blockMinutes)} block seals the goal`;
  }
  return `${Math.ceil(remaining / blockMinutes)} blocks stand between you and ${goalLabel}`;
}

function weekDayLabel(dateStr: string) {
  const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
  return labels[new Date(`${dateStr}T12:00:00`).getDay()];
}

function isToday(dateStr: string) {
  return dateStr === toDateString(new Date());
}

function streakTier(streak: number) {
  if (streak >= 7) return "high";
  if (streak >= 3) return "mid";
  return "low";
}

const NIGHT_STARS = [
  { x: 68, y: 32, r: 0.3 },
  { x: 74, y: 26, r: 0.22 },
  { x: 80, y: 34, r: 0.28 },
  { x: 76, y: 40, r: 0.18 },
  { x: 84, y: 28, r: 0.24 },
] as const;

function skyPhaseNow(): "dawn" | "noon" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "dawn";
  if (hour >= 11 && hour < 17) return "noon";
  return "night";
}

function SkyPhaseLabel({
  label,
  icon: Icon,
  active,
}: {
  label: string;
  icon: typeof Sunrise;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 transition-colors duration-500",
        active ? "text-foreground" : "text-muted-foreground/55",
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full border transition-all duration-500",
          active
            ? "border-foreground/20 bg-foreground/[0.07] shadow-[0_0_20px_oklch(1_0_0/0.06)]"
            : "border-transparent bg-transparent",
        )}
      >
        <Icon
          className={cn("size-3.5", active && "opacity-100")}
          strokeWidth={active ? 2 : 1.5}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          "text-[10px] font-medium tracking-[0.14em] uppercase",
          active && "tracking-[0.18em]",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function ConstellationSky({
  marks,
  liveMark,
  sealMark,
  liveFocus,
  ready,
}: {
  marks: FocusTodayMark[];
  liveMark: {
    point: { x: number; y: number; t: number };
    radius: number;
    title: string;
  } | null;
  sealMark: {
    point: { x: number; y: number };
    radius: number;
    title: string;
  } | null;
  liveFocus: boolean;
  ready: boolean;
}) {
  const sorted = [...marks].sort(
    (a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
  const phase = ready ? skyPhaseNow() : null;
  const nowPoint = ready ? constellationPoint(new Date().toISOString()) : null;

  return (
    <div className="focus-sky-dome w-full">
      <svg
        viewBox="0 0 100 68"
        className="focus-constellation-sky h-auto w-full"
        aria-label="Today's focus sessions by time of day"
      >
        <defs>
          <linearGradient id="focus-sky-dome" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.84 0.11 58)" stopOpacity="0.28" />
            <stop offset="45%" stopColor="oklch(0.78 0.05 235)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="oklch(0.58 0.14 285)" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id="focus-sky-vignette" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="55%" stopColor="white" stopOpacity="0.45" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="focus-sky-vignette-mask">
            <rect x="0" y="0" width="100" height="68" fill="url(#focus-sky-vignette)" />
          </mask>
          <linearGradient id="focus-arc-shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.88 0.1 62)" stopOpacity="0.55" />
            <stop offset="48%" stopColor="oklch(0.95 0.02 240)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="oklch(0.72 0.12 290)" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <path
          d="M 14 58 A 36 36 0 0 1 86 58 Z"
          fill="url(#focus-sky-dome)"
          mask="url(#focus-sky-vignette-mask)"
          className="focus-sky-fill"
        />

        {NIGHT_STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            className="focus-sky-star fill-foreground/35"
          />
        ))}

        <line
          x1="6"
          y1="58.75"
          x2="94"
          y2="58.75"
          className="stroke-border/25"
          strokeWidth="0.5"
        />

        <path
          d="M 14 58 A 36 36 0 0 1 86 58"
          fill="none"
          stroke="url(#focus-arc-shimmer)"
          strokeWidth="0.85"
          strokeLinecap="round"
          className="focus-sky-arc"
        />

        <path
          d="M 14 58 A 36 36 0 0 1 86 58"
          fill="none"
          className="stroke-foreground/[0.07]"
          strokeWidth="0.35"
          strokeDasharray="0.6 2.8"
        />

        {[0, 0.5, 1].map((t) => {
          const p = arcPoint(t);
          return (
            <circle
              key={t}
              cx={p.x}
              cy={p.y}
              r="0.65"
              className="fill-background stroke-foreground/20"
              strokeWidth="0.35"
            />
          );
        })}

        {sorted.length >= 2
          ? sorted.slice(0, -1).map((mark, i) => {
              const a = constellationPoint(mark.started_at);
              const b = constellationPoint(sorted[i + 1]!.started_at);
              return (
                <line
                  key={`${mark.started_at}-link`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  className="stroke-foreground/12"
                  strokeWidth="0.4"
                />
              );
            })
          : null}

        {marks.length === 0 && !liveFocus ? (
          <circle cx="50" cy="40" r="0.75" className="fill-foreground/20" />
        ) : null}

        {nowPoint && !liveMark ? (
          <g className="focus-sky-now">
            <circle
              cx={nowPoint.x}
              cy={nowPoint.y}
              r="1.35"
              className="fill-foreground/10"
            />
            <circle
              cx={nowPoint.x}
              cy={nowPoint.y}
              r="0.5"
              className="fill-foreground/45"
            />
          </g>
        ) : null}

        {sorted.map((mark) => {
          const point = constellationPoint(mark.started_at);
          const r = markRadius(mark.minutes);
          return (
            <g key={mark.started_at + mark.minutes}>
              <title>
                {ready
                  ? `${formatMarkTime(mark.started_at)} · ${formatFocusMinutes(mark.minutes)}`
                  : formatFocusMinutes(mark.minutes)}
              </title>
              <circle
                cx={point.x}
                cy={point.y}
                r={r + 0.55}
                className="fill-foreground/8"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={r}
                className="fill-foreground"
              />
            </g>
          );
        })}

        {liveMark ? (
          <g className="focus-constellation-live text-foreground">
            <title>{liveMark.title}</title>
            <circle
              cx={liveMark.point.x}
              cy={liveMark.point.y}
              r={liveMark.radius + 1.1}
              className="focus-constellation-live-halo fill-foreground/10"
            />
            <circle
              cx={liveMark.point.x}
              cy={liveMark.point.y}
              r={liveMark.radius}
              className="fill-foreground"
            />
          </g>
        ) : null}

        {sealMark ? (
          <g
            className="focus-constellation-seal text-foreground"
            transform={`translate(${sealMark.point.x} ${sealMark.point.y})`}
          >
            <title>{sealMark.title}</title>
            <circle cx={0} cy={0} r={sealMark.radius + 1.1} className="fill-foreground/12" />
            <circle
              cx={0}
              cy={0}
              r={sealMark.radius}
              className="focus-constellation-seal-core fill-foreground"
            />
          </g>
        ) : null}
      </svg>

      <div className="focus-sky-labels mt-3 grid grid-cols-3 items-start px-0.5">
        <SkyPhaseLabel label="Dawn" icon={Sunrise} active={phase === "dawn"} />
        <SkyPhaseLabel label="Noon" icon={Sun} active={phase === "noon"} />
        <SkyPhaseLabel label="Night" icon={Moon} active={phase === "night"} />
      </div>
    </div>
  );
}

function HorizonTrack({
  progress,
  ready,
  todayLabel,
  goalLabel,
  compact,
}: {
  progress: number;
  ready: boolean;
  todayLabel: string;
  goalLabel: string;
  compact: boolean;
}) {
  const sunX = 8 + (progress / 100) * 84;

  return (
    <div className={cn("focus-horizon space-y-2", compact && "opacity-90")}>
      {!compact ? (
        <div className="flex items-baseline justify-between gap-3 text-xs tabular-nums text-muted-foreground">
          <span>{todayLabel}</span>
          <span>{goalLabel}</span>
        </div>
      ) : null}
      <svg viewBox="0 0 100 22" className="h-6 w-full" aria-hidden>
        <defs>
          <linearGradient id="focus-horizon-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.11 65 / 0.55)" />
            <stop offset="48%" stopColor="oklch(0.68 0.07 245 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.62 0.09 295 / 0.55)" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="14"
          width="92"
          height="2.5"
          rx="1.25"
          fill="url(#focus-horizon-grad)"
          opacity="0.65"
        />
        {ready && progress > 0 ? (
          <>
            <circle
              cx={sunX}
              cy="11"
              r="4.5"
              className="fill-foreground/12"
            />
            <circle
              cx={sunX}
              cy="11"
              r="2.6"
              className="focus-horizon-sun fill-foreground"
            />
          </>
        ) : null}
      </svg>
      {!compact ? (
        <p className="text-center text-[11px] tabular-nums text-muted-foreground lg:text-left">
          {Math.round(progress)}% across today&apos;s horizon
        </p>
      ) : null}
    </div>
  );
}

export function FocusStats({ stats }: FocusStatsProps) {
  const lastFocusSeconds = useFocusTimer((s) => s.lastFocusSeconds);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const mode = useFocusTimer((s) => s.mode);
  const clock = useFocusTimer((s) => s.clock);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const sessionStartedAt = useFocusTimer((s) => s.sessionStartedAt);
  const endsAt = useFocusTimer((s) => s.endsAt);
  const liveElapsedSeconds = useFocusTimer((s) => {
    if (s.clock !== "up") return 0;
    if (!s.isRunning) return s.elapsedSeconds;
    void s.tickMs;
    return s.liveElapsedSeconds();
  });
  const sealPulse = useFocusTimer((s) => s.sealPulse);
  const clearSealPulse = useFocusTimer((s) => s.clearSealPulse);
  const pageVisible = useDocumentVisible();
  const [goalMinutes, setGoalMinutes] = useState(FOCUS_DAILY_GOAL_DEFAULT);
  const [ready, setReady] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    setGoalMinutes(readGoalMinutes());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!sealPulse) return;
    const id = window.setTimeout(() => clearSealPulse(), 3200);
    return () => window.clearTimeout(id);
  }, [sealPulse, clearSealPulse]);

  useEffect(() => {
    if (!sealPulse) return;
    const inStats =
      stats.today_marks?.some(
        (mark) =>
          Math.abs(
            new Date(mark.started_at).getTime() -
              new Date(sealPulse.startedAt).getTime(),
          ) < 10_000,
      ) ?? false;
    if (inStats) clearSealPulse();
  }, [sealPulse, stats.today_marks, clearSealPulse]);

  function updateGoal(minutes: number) {
    setGoalMinutes(minutes);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(minutes));
    setGoalOpen(false);
  }

  const stopwatchSession =
    clock === "up" && liveElapsedSeconds > 0 ? liveElapsedSeconds : 0;
  const countdownSession =
    mode === "focus" && durationSeconds > remainingSeconds
      ? durationSeconds - remainingSeconds
      : 0;
  const sessionSeconds = stopwatchSession || countdownSession;
  const liveFocus =
    isRunning &&
    pageVisible &&
    (clock === "up" || (mode === "focus" && durationSeconds > remainingSeconds));
  const compact = liveFocus;
  const liveSessionSeconds = liveFocus ? sessionSeconds : 0;
  const marks = stats.today_marks ?? [];
  const sessionActive = sessionSeconds > 0;
  const sealAlreadyInStats =
    sealPulse &&
    marks.some(
      (mark) =>
        Math.abs(
          new Date(mark.started_at).getTime() -
            new Date(sealPulse.startedAt).getTime(),
        ) < 10_000,
    );
  const optimisticSealSeconds =
    sealPulse && !sealAlreadyInStats ? sealPulse.seconds : 0;
  const todayTotalSeconds =
    stats.focus_minutes * 60 +
    (liveFocus ? liveSessionSeconds : sessionSeconds) +
    optimisticSealSeconds;
  const goalTotalSeconds = goalMinutes * 60;
  const focusMinutes = Math.floor(todayTotalSeconds / 60);

  const progress = Math.min(
    100,
    (todayTotalSeconds / Math.max(goalTotalSeconds, 1)) * 100,
  );
  const met = todayTotalSeconds >= goalTotalSeconds;
  const goalRemainingSeconds = Math.max(
    0,
    goalTotalSeconds - todayTotalSeconds,
  );
  const blockMinutes = Math.max(1, Math.round(lastFocusSeconds / 60));

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = toDateString(yesterdayDate);
  const yesterdayMinutes =
    stats.week.find((day) => day.date === yesterdayKey)?.minutes ?? 0;

  const todayTotalLabel = formatFocusDuration(todayTotalSeconds);
  const goalLabel = formatFocusMinutes(goalMinutes);
  const whisper = ready
    ? smartWhisper({
        marks,
        focusMinutes,
        goalMinutes,
        yesterdayMinutes,
        blockMinutes,
        met,
        goalLabel,
      })
    : null;
  const motivator = ready
    ? heroMotivator({
        met,
        goalRemainingSeconds,
        focusMinutes,
        yesterdayMinutes,
        weekMinutes: stats.week.map((d) => d.minutes),
        goalLabel,
      })
    : null;

  const liveMarkIso =
    liveFocus && clock === "up" && sessionStartedAt
      ? new Date(sessionStartedAt).toISOString()
      : liveFocus && mode === "focus" && endsAt
        ? new Date(endsAt - durationSeconds * 1000).toISOString()
        : null;

  const constellationLitLabel = sealPulse
    ? "Star sealed"
    : marks.length === 0 && !liveFocus
      ? "Clear sky"
      : liveFocus
        ? marks.length === 0
          ? "Star forming"
          : `${marks.length} lit · live`
        : `${marks.length} lit`;

  const liveMark = liveMarkIso
    ? {
        point: constellationPoint(liveMarkIso),
        radius: markRadius(
          Math.max(1, Math.round(liveSessionSeconds / 60)),
        ),
        title: ready
          ? `${formatMarkTime(liveMarkIso)} · ${formatFocusDuration(liveSessionSeconds)} · live`
          : "Live session",
      }
    : null;

  const sealMark =
    sealPulse && !sealAlreadyInStats
      ? {
          point: constellationPoint(sealPulse.startedAt),
          radius: markRadius(
            Math.max(1, Math.round(sealPulse.seconds / 60)),
          ),
          title: ready
            ? `${formatMarkTime(sealPulse.startedAt)} · ${formatFocusDuration(sealPulse.seconds)} · sealed`
            : "Session sealed",
        }
      : null;

  const weekday = ready
    ? new Date().toLocaleDateString("en-US", { weekday: "long" })
    : null;

  const todayDisplayMinutes = Math.floor(todayTotalSeconds / 60);
  const weekDays = stats.week.map((day) => ({
    ...day,
    minutes: isToday(day.date) ? todayDisplayMinutes : day.minutes,
  }));

  const weekMaxMinutes = Math.max(
    1,
    ...weekDays.map((d) => d.minutes),
  );

  return (
    <section
      data-live={liveFocus ? "true" : "false"}
      data-visible={pageVisible ? "true" : "false"}
      data-compact={compact ? "true" : "false"}
      data-sealed={sealPulse ? "true" : "false"}
      data-mode={mode}
      data-streak={streakTier(stats.current_streak)}
      className="focus-progress focus-companion relative flex min-h-0 w-full flex-col lg:min-h-[30rem]"
    >
      <div className="relative z-[1] flex flex-1 flex-col gap-5">
        <div className="text-center lg:text-left">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Your sky
          </p>
          <p className="mt-1.5 flex items-baseline justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
            <span>
              {liveFocus
                ? "Session in flight"
                : sessionActive && !isRunning
                  ? "Session paused"
                  : (weekday ?? "Today")}
            </span>
            {marks.length > 0 || liveFocus ? (
              <span className="text-xs tabular-nums text-muted-foreground/70">
                · {constellationLitLabel}
              </span>
            ) : null}
          </p>
        </div>

        <div className="focus-constellation-stage w-full">
          <ConstellationSky
            marks={marks}
            liveMark={liveMark}
            sealMark={sealMark}
            liveFocus={liveFocus}
            ready={ready}
          />
        </div>

        <div
          className={cn(
            "focus-progress-hero relative space-y-4 transition-all duration-500",
            compact && "space-y-2",
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goalTotalSeconds}
          aria-valuenow={Math.min(todayTotalSeconds, goalTotalSeconds)}
          aria-label="Daily focus goal progress"
        >
          <HorizonTrack
            progress={ready ? progress : 0}
            ready={ready}
            todayLabel={todayTotalLabel}
            goalLabel={goalLabel}
            compact={compact}
          />

          {!compact ? (
            <>
              {motivator ? (
                <div className="text-center lg:text-left">
                  <p className="text-[2rem] font-medium leading-none tracking-tight text-foreground sm:text-[2.35rem]">
                    {motivator.headline}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {motivator.sub}
                  </p>
                </div>
              ) : null}

              {whisper ? (
                <p className="text-center text-sm text-foreground/85 lg:text-left">
                  {whisper}
                </p>
              ) : null}

              <div className="text-center lg:text-left">
                <button
                  type="button"
                  onClick={() => setGoalOpen((value) => !value)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground/80 transition-colors hover:text-foreground"
                  aria-expanded={goalOpen}
                >
                  Goal · {goalLabel}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      goalOpen && "rotate-180",
                    )}
                  />
                </button>
                {goalOpen ? (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 lg:justify-start">
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

              <div className="w-full">
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  This week
                </p>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {weekDays.map((day) => {
                    const height = Math.max(
                      6,
                      Math.round((day.minutes / weekMaxMinutes) * 100),
                    );
                    const today = isToday(day.date);
                    return (
                      <div
                        key={day.date}
                        className="flex min-w-0 flex-col items-center gap-2"
                        title={`${formatFocusMinutes(day.minutes)} focused`}
                      >
                        <div className="flex h-16 w-full items-end rounded-lg bg-muted/30 px-1 pb-1 sm:h-[4.5rem]">
                          <div
                            className={cn(
                              "w-full min-h-[3px] rounded-[3px] bg-foreground/70 transition-all duration-500",
                              today && "bg-foreground",
                              day.minutes === 0 && "bg-foreground/25",
                              liveFocus && today && "opacity-90",
                            )}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums text-muted-foreground",
                            today && "font-medium text-foreground",
                          )}
                        >
                          {weekDayLabel(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          <span>
            Streak{" "}
            <span className="tabular-nums text-foreground">
              {stats.current_streak}d
            </span>
            {stats.longest_streak > 0 ? ` · best ${stats.longest_streak}d` : ""}
          </span>
          <span className="tabular-nums">
            {liveFocus
              ? "Sky live"
              : sessionActive && !isRunning
                ? "Paused"
                : "Day taking shape"}
          </span>
        </div>
      </div>
    </section>
  );
}
