"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, Moon, Play, Sun, Sunrise } from "lucide-react";

import { updateDailyFocusGoal } from "@/actions/focus";
import { useDocumentVisible } from "@/hooks/use-document-visible";
import {
  buildPickupHint,
  continueSubject,
} from "@/lib/focus-continue";
import {
  skyArcPath,
  skyArcPoint,
  skyTimeToT,
  unstackSkyPoints,
} from "@/lib/focus-sky";
import { focusThreadKey } from "@/lib/focus-threads";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/date-utils";
import { canContinueFocusSession, useFocusTimer } from "@/stores/focus-timer";
import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  formatFocusDuration,
  formatFocusMinutes,
  formatFocusMinutesCompact,
  type DailyFocusGoal,
  type FocusTodayMark,
  type FocusOverviewStats,
} from "@/types/focus";

type FocusStatsProps = {
  stats: FocusOverviewStats;
  dailyGoal: DailyFocusGoal;
};

function markThreadKey(mark: FocusTodayMark) {
  return focusThreadKey({
    id: mark.id,
    mode: "focus",
    started_at: mark.started_at,
    task_id: mark.task_id,
    note: mark.note,
  });
}

function liveThreadKey({
  nowIso,
  linkedTaskId,
  intention,
  continuedSessionId,
}: {
  nowIso: string;
  linkedTaskId: string | null;
  intention: string;
  continuedSessionId: string | null;
}) {
  return focusThreadKey({
    id: continuedSessionId ?? "live",
    mode: "focus",
    started_at: nowIso,
    task_id: linkedTaskId,
    note: intention,
  });
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
  if (raw == null) return FOCUS_DAILY_GOAL_DEFAULT;
  const value = Number(raw);
  if (!Number.isFinite(value)) return FOCUS_DAILY_GOAL_DEFAULT;
  return clampDailyFocusGoal(value);
}

function companionStory({
  met,
  focusMinutes,
  yesterdayMinutes,
  weekMinutes,
  blockMinutes,
  goalMinutes,
  goalLabel,
  marks,
  goalRemainingSeconds,
}: {
  met: boolean;
  focusMinutes: number;
  yesterdayMinutes: number;
  weekMinutes: number[];
  blockMinutes: number;
  goalMinutes: number;
  goalLabel: string;
  marks: FocusTodayMark[];
  goalRemainingSeconds: number;
}) {
  if (met) return "Goal sealed · room for more if you want it";
  if (focusMinutes === 0) return "First star is one session away";

  if (
    yesterdayMinutes > 0 &&
    focusMinutes + blockMinutes > yesterdayMinutes
  ) {
    return `One more ${formatFocusMinutes(blockMinutes)} beats yesterday`;
  }

  if (yesterdayMinutes > 0 && focusMinutes < yesterdayMinutes) {
    const gap = yesterdayMinutes - focusMinutes;
    return `${formatFocusMinutes(Math.max(1, gap))} to beat yesterday`;
  }

  const weekBest = Math.max(0, ...weekMinutes);
  if (weekBest > 0 && focusMinutes >= weekBest && marks.length > 0) {
    return "Best day this week so far";
  }

  const remaining = Math.max(0, goalMinutes - focusMinutes);
  if (remaining <= blockMinutes) {
    return `One ${formatFocusMinutes(blockMinutes)} block seals the goal`;
  }

  if (marks.length >= 2) {
    return `${marks.length} stars lit · ${formatFocusDuration(goalRemainingSeconds)} to goal`;
  }

  return `${Math.ceil(remaining / blockMinutes)} blocks to ${goalLabel}`;
}

function weekDayLabel(dateStr: string) {
  const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
  return labels[new Date(`${dateStr}T12:00:00`).getDay()];
}

function weekPaceLabel(
  weekDays: { date: string; minutes: number }[],
  goalMinutes: number,
  todayKey: string,
) {
  if (goalMinutes <= 0) return null;
  const weekGoal = goalMinutes * 7;
  const soFar = weekDays.reduce((sum, day) => sum + day.minutes, 0);
  if (soFar >= weekGoal) return "Week goal sealed";

  const todayIndex = weekDays.findIndex((day) => day.date === todayKey);
  if (todayIndex < 0) return null;
  const daysLeft = weekDays.length - todayIndex;
  const remaining = Math.max(0, weekGoal - soFar);
  if (daysLeft <= 1) {
    return `${formatFocusMinutes(remaining)} left today`;
  }
  const perDay = Math.max(1, Math.ceil(remaining / daysLeft));
  return `${formatFocusMinutes(perDay)} / day through Friday`;
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

type SkyPhase = "dawn" | "noon" | "night";

function skyPhaseAt(date: Date): SkyPhase {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "dawn";
  if (hour >= 11 && hour < 17) return "noon";
  return "night";
}

function skyPhaseNow(): SkyPhase {
  return skyPhaseAt(new Date());
}

function SkyPhaseLabel({
  label,
  icon: Icon,
  active,
  filtered,
  onClick,
}: {
  label: string;
  icon: typeof Sunrise;
  active: boolean;
  filtered: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl px-1 py-1 transition-colors duration-300",
          filtered
            ? "text-foreground"
            : active
              ? "focus-sky-phase-active text-foreground/80"
              : "text-muted-foreground/45 hover:text-muted-foreground",
      )}
      aria-pressed={filtered}
      aria-label={`Show ${label.toLowerCase()} sessions`}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full border transition-all duration-300",
          filtered
            ? "border-foreground/25 bg-foreground/[0.08]"
            : active
              ? "border-foreground/15 bg-foreground/[0.04]"
              : "border-transparent bg-transparent",
        )}
      >
        <Icon
          className="size-3.5"
          strokeWidth={filtered || active ? 2 : 1.5}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          "text-[10px] font-medium tracking-[0.14em] uppercase",
          (filtered || active) && "tracking-[0.18em]",
        )}
      >
        {label}
      </span>
    </button>
  );
}

type SkyLayoutItem =
  | {
      key: string;
      t: number;
      radius: number;
      kind: "session";
      mark: FocusTodayMark;
    }
  | {
      key: string;
      t: number;
      radius: number;
      kind: "live" | "seal";
    };

function ConstellationSky({
  marks,
  liveMark,
  sealMark,
  liveFocus,
  continuing,
  ready,
}: {
  marks: FocusTodayMark[];
  liveMark: {
    t: number;
    trailFromT: number;
    radius: number;
    title: string;
    threadKey: string;
  } | null;
  sealMark: {
    t: number;
    radius: number;
    title: string;
  } | null;
  liveFocus: boolean;
  continuing: boolean;
  ready: boolean;
}) {
  const [filter, setFilter] = useState<SkyPhase | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const sorted = [...marks].sort(
    (a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
  const phase = ready ? skyPhaseNow() : null;
  const empty = marks.length === 0 && !liveFocus;

  const visible = filter
    ? sorted.filter(
        (mark) => skyPhaseAt(new Date(mark.started_at)) === filter,
      )
    : sorted;

  const selected = visible.find((mark) => mark.id === selectedKey) ?? null;

  const sessionItems: SkyLayoutItem[] = sorted.map((mark) => ({
    key: mark.id,
    t: skyTimeToT(new Date(mark.started_at)),
    radius: markRadius(mark.minutes),
    kind: "session",
    mark,
  }));
  const overlayItems: SkyLayoutItem[] = [];
  if (sealMark) {
    overlayItems.push({
      key: "seal",
      t: sealMark.t,
      radius: sealMark.radius,
      kind: "seal",
    });
  }
  if (liveMark) {
    overlayItems.push({
      key: "live",
      t: liveMark.t,
      radius: liveMark.radius,
      kind: "live",
    });
  }

  const placed = unstackSkyPoints(sessionItems, overlayItems);
  const sessionPlaced = placed.filter(
    (
      item,
    ): item is Extract<SkyLayoutItem, { kind: "session" }> & {
      x: number;
      y: number;
    } => item.kind === "session",
  );
  const livePlaced = placed.find((item) => item.kind === "live") ?? null;
  const sealPlaced = placed.find((item) => item.kind === "seal") ?? null;
  const placedById = new Map(
    sessionPlaced.map((item) => [item.mark.id, item]),
  );

  const threadLinks: { key: string; x1: number; y1: number; x2: number; y2: number }[] =
    [];
  const visibleIds = new Set(visible.map((mark) => mark.id));
  const byThread = new Map<string, typeof sessionPlaced>();
  for (const item of sessionPlaced) {
    if (!visibleIds.has(item.mark.id)) continue;
    const key = markThreadKey(item.mark);
    const group = byThread.get(key) ?? [];
    group.push(item);
    byThread.set(key, group);
  }
  for (const [threadKey, group] of byThread) {
    if (group.length < 2) continue;
    const ordered = [...group].sort((a, b) => a.t - b.t);
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i]!;
      const b = ordered[i + 1]!;
      threadLinks.push({
        key: `${threadKey}:${a.mark.id}:${b.mark.id}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
      });
    }
  }

  const runArc = liveMark ? skyArcPath(liveMark.trailFromT, liveMark.t) : null;

  function toggleFilter(next: SkyPhase) {
    setFilter((current) => (current === next ? null : next));
    setSelectedKey(null);
  }

  function selectMark(mark: FocusTodayMark) {
    setSelectedKey((current) => (current === mark.id ? null : mark.id));
  }

  return (
    <div className="focus-sky-dome flex w-full flex-col">
      <svg
        viewBox="6 14 88 52"
        className="focus-constellation-sky h-auto w-full"
        aria-label="Today's focus sessions by time of day. Tap a star for details."
        onClick={() => setSelectedKey(null)}
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
            className={cn(
              "focus-sky-star fill-foreground/35",
              filter && filter !== "night" && "opacity-20",
            )}
            style={{ animationDelay: `${i * 0.85}s` }}
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
          const p = skyArcPoint(t);
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

        {runArc ? (
          <path
            d={runArc}
            fill="none"
            className="stroke-foreground/28"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        ) : null}

        {threadLinks.map((link) => (
          <line
            key={link.key}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            className="stroke-foreground/20"
            strokeWidth="0.45"
          />
        ))}

        {sorted.map((mark) => {
          const point = placedById.get(mark.id);
          if (!point) return null;
          const r = point.radius;
          const inFilter = visibleIds.has(mark.id);
          const isSelected = selectedKey === mark.id;
          return (
            <g
              key={mark.id}
              className={cn(
                "focus-sky-session cursor-pointer",
                !inFilter && "opacity-20",
                inFilter &&
                  liveMark &&
                  markThreadKey(mark) === liveMark.threadKey &&
                  "opacity-100",
              )}
              onClick={(event) => {
                event.stopPropagation();
                if (!inFilter) return;
                selectMark(mark);
              }}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="5.5"
                className="fill-transparent"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={r + (isSelected ? 1.1 : 0.55)}
                className={cn(
                  "fill-foreground/8",
                  isSelected && "fill-foreground/20",
                )}
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

        {liveMark && livePlaced ? (
          <g className="focus-constellation-live pointer-events-none text-foreground">
            {[0.028, 0.016, 0.007].map((back, i) => {
              const trail = skyArcPoint(Math.max(liveMark.trailFromT, liveMark.t - back));
              return (
                <circle
                  key={back}
                  cx={trail.x}
                  cy={trail.y}
                  r={Math.max(0.35, liveMark.radius - 0.35 - i * 0.2)}
                  className="focus-sky-trail fill-foreground"
                  opacity={0.22 - i * 0.06}
                />
              );
            })}
            {continuing ? (
              <circle
                cx={livePlaced.x}
                cy={livePlaced.y}
                r={liveMark.radius + 2.4}
                className="focus-sky-continue-ring fill-none stroke-foreground/50"
                strokeWidth="0.45"
              />
            ) : null}
            <circle
              cx={livePlaced.x}
              cy={livePlaced.y}
              r={liveMark.radius + 1.1}
              className="focus-constellation-live-halo fill-foreground/10"
            />
            <circle
              cx={livePlaced.x}
              cy={livePlaced.y}
              r={liveMark.radius}
              className="fill-foreground"
            />
          </g>
        ) : null}

        {sealMark && sealPlaced ? (
          <g className="pointer-events-none text-foreground">
            <line
              x1={sealPlaced.x + 9}
              y1={sealPlaced.y - 5}
              x2={sealPlaced.x}
              y2={sealPlaced.y}
              className="focus-constellation-meteor stroke-foreground/70"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
            <g
              className="focus-constellation-seal"
              transform={`translate(${sealPlaced.x} ${sealPlaced.y})`}
            >
              <circle
                cx={0}
                cy={0}
                r={sealMark.radius + 2.2}
                className="focus-constellation-seal-flash fill-foreground/15"
              />
              <circle cx={0} cy={0} r={sealMark.radius + 1.1} className="fill-foreground/12" />
              <circle
                cx={0}
                cy={0}
                r={sealMark.radius}
                className="focus-constellation-seal-core fill-foreground"
              />
            </g>
          </g>
        ) : null}
      </svg>

      <p className="focus-sky-caption mt-2 min-h-5 text-center text-[11px] tabular-nums text-muted-foreground">
        {!ready
          ? ""
          : selected
            ? `${formatMarkTime(selected.started_at)} · ${formatFocusMinutes(selected.minutes)}`
            : liveFocus
              ? liveMark?.title ?? "Session in flight"
              : empty
                ? "No stars yet · start a block"
                : filter
                  ? visible.length === 0
                    ? `No ${filter} sessions today`
                    : `${visible.length} ${filter} star${visible.length === 1 ? "" : "s"}`
                  : "Tap a star for time"}
      </p>

      <div className="focus-sky-labels mt-1 grid grid-cols-3 items-start px-0.5">
        <SkyPhaseLabel
          label="Dawn"
          icon={Sunrise}
          active={phase === "dawn"}
          filtered={filter === "dawn"}
          onClick={() => toggleFilter("dawn")}
        />
        <SkyPhaseLabel
          label="Noon"
          icon={Sun}
          active={phase === "noon"}
          filtered={filter === "noon"}
          onClick={() => toggleFilter("noon")}
        />
        <SkyPhaseLabel
          label="Night"
          icon={Moon}
          active={phase === "night"}
          filtered={filter === "night"}
          onClick={() => toggleFilter("night")}
        />
      </div>
    </div>
  );
}

export function FocusStats({ stats, dailyGoal }: FocusStatsProps) {
  const lastFocusSeconds = useFocusTimer((s) => s.lastFocusSeconds);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const mode = useFocusTimer((s) => s.mode);
  const clock = useFocusTimer((s) => s.clock);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const elapsedSeconds = useFocusTimer((s) => s.elapsedSeconds);
  const progressBaseSeconds = useFocusTimer((s) => s.progressBaseSeconds);
  const intention = useFocusTimer((s) => s.intention);
  const linkedTaskId = useFocusTimer((s) => s.linkedTaskId);
  const continuedSessionId = useFocusTimer((s) => s.continuedSessionId);
  const start = useFocusTimer((s) => s.start);
  const sessionStartedAt = useFocusTimer((s) => s.sessionStartedAt);
  const endsAt = useFocusTimer((s) => s.endsAt);
  const sealPulse = useFocusTimer((s) => s.sealPulse);
  const clearSealPulse = useFocusTimer((s) => s.clearSealPulse);
  const pageVisible = useDocumentVisible();
  const [goalMinutes, setGoalMinutes] = useState(dailyGoal.minutes);
  const [ready, setReady] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(false);
  const [skySessionSeconds, setSkySessionSeconds] = useState(0);
  const [, startGoalTransition] = useTransition();

  useEffect(() => {
    const local = readGoalMinutes();
    if (!dailyGoal.saved && local !== dailyGoal.minutes) {
      setGoalMinutes(local);
      window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(local));
      startGoalTransition(async () => {
        await updateDailyFocusGoal(local);
      });
    } else {
      setGoalMinutes(dailyGoal.minutes);
      window.localStorage.setItem(
        FOCUS_DAILY_GOAL_KEY,
        String(dailyGoal.minutes),
      );
    }
    setReady(true);
  }, [dailyGoal.minutes, dailyGoal.saved]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setMobileLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Sky progress: sync on pause / visibility, otherwise every 30s — not 1 Hz.
  useEffect(() => {
    function readSessionSeconds() {
      const s = useFocusTimer.getState();
      if (s.clock === "up") {
        return s.isRunning ? s.liveElapsedSeconds() : s.elapsedSeconds;
      }
      if (s.mode !== "focus") return 0;
      if (s.isRunning && s.endsAt) {
        return Math.max(
          0,
          s.durationSeconds -
            Math.max(0, Math.round((s.endsAt - Date.now()) / 1000)),
        );
      }
      return Math.max(0, s.durationSeconds - s.remainingSeconds);
    }

    setSkySessionSeconds(readSessionSeconds());

    const live =
      isRunning &&
      pageVisible &&
      (clock === "up" || mode === "focus");
    if (!live) return;

    const id = window.setInterval(() => {
      setSkySessionSeconds(readSessionSeconds());
    }, 30_000);
    return () => window.clearInterval(id);
  }, [
    isRunning,
    pageVisible,
    clock,
    mode,
    elapsedSeconds,
    remainingSeconds,
    durationSeconds,
    endsAt,
  ]);

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
    const next = clampDailyFocusGoal(minutes);
    setGoalMinutes(next);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(next));
    setGoalOpen(false);
    startGoalTransition(async () => {
      await updateDailyFocusGoal(next);
    });
  }

  const stopwatchSession =
    clock === "up" && skySessionSeconds > 0 ? skySessionSeconds : 0;
  const countdownSession =
    mode === "focus" && skySessionSeconds > 0 ? skySessionSeconds : 0;
  const sessionSeconds = stopwatchSession || countdownSession;
  const canContinue = canContinueFocusSession({
    clock,
    mode,
    elapsedSeconds,
    isRunning,
    sessionStartedAt,
    durationSeconds,
    remainingSeconds,
    progressBaseSeconds,
  });
  const pickupHint =
    progressBaseSeconds > 0
      ? buildPickupHint(sessionSeconds, continueSubject(intention, null))
      : null;
  const sessionContribution = Math.max(0, sessionSeconds - progressBaseSeconds);
  const liveFocus =
    isRunning &&
    pageVisible &&
    (clock === "up" || mode === "focus");
  const compact = liveFocus || (mobileLayout && canContinue);
  const liveSessionSeconds = liveFocus ? sessionSeconds : 0;
  const marks = stats.today_marks ?? [];
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
    stats.focus_minutes * 60 + sessionContribution + optimisticSealSeconds;
  const goalTotalSeconds = goalMinutes * 60;
  const focusMinutes = Math.floor(todayTotalSeconds / 60);

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
  const story = ready
    ? companionStory({
        met,
        focusMinutes,
        yesterdayMinutes,
        weekMinutes: stats.week.map((d) => d.minutes),
        blockMinutes,
        goalMinutes,
        goalLabel,
        marks,
        goalRemainingSeconds,
      })
    : null;

  const liveNow = liveFocus ? new Date() : null;
  const liveNowIso = liveNow?.toISOString() ?? null;
  const liveSegmentStart = liveNow
    ? new Date(
        liveNow.getTime() -
          Math.max(0, liveSessionSeconds - progressBaseSeconds) * 1000,
      )
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

  const liveMark =
    liveNow && liveNowIso
      ? {
          t: skyTimeToT(liveNow),
          trailFromT: skyTimeToT(liveSegmentStart ?? liveNow),
          radius: markRadius(
            Math.max(1, Math.round(liveSessionSeconds / 60)),
          ),
          title: ready
            ? `${formatMarkTime(liveNowIso)} · ${formatFocusDuration(liveSessionSeconds)} · live`
            : "Live session",
          threadKey: liveThreadKey({
            nowIso: liveNowIso,
            linkedTaskId,
            intention,
            continuedSessionId,
          }),
        }
      : null;

  const sealMark =
    sealPulse && !sealAlreadyInStats
      ? {
          t: skyTimeToT(new Date(sealPulse.startedAt)),
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

  const weekScale = Math.max(
    1,
    goalMinutes,
    ...weekDays.map((d) => d.minutes),
  );
  const goalLinePct = Math.min(
    100,
    (goalMinutes / weekScale) * 100,
  );
  const todayKey = toDateString(new Date());
  const pace = ready ? weekPaceLabel(weekDays, goalMinutes, todayKey) : null;

  return (
    <section
      data-live={liveFocus ? "true" : "false"}
      data-visible={pageVisible ? "true" : "false"}
      data-calm="true"
      data-compact={compact ? "true" : "false"}
      data-sealed={sealPulse ? "true" : "false"}
      data-continuing={progressBaseSeconds > 0 ? "true" : "false"}
      data-mode={mode}
      data-streak={streakTier(stats.current_streak)}
      className="focus-progress focus-companion relative flex min-h-0 w-full flex-col"
    >
      <div className="relative z-[1] grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10 xl:gap-12">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="text-center lg:text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your sky
            </p>
            <p className="mt-1.5 flex min-h-5 items-baseline justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
              <span>
                {liveFocus
                  ? "Session in flight"
                  : canContinue
                    ? "Continue session"
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
              continuing={progressBaseSeconds > 0}
              ready={ready}
            />
          </div>
        </div>

        <div
          className={cn(
            "focus-progress-hero relative flex min-w-0 flex-col transition-all duration-500",
            compact ? "gap-4" : "gap-5",
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goalTotalSeconds}
          aria-valuenow={Math.min(todayTotalSeconds, goalTotalSeconds)}
          aria-label="Daily focus goal progress"
        >
          <div className="text-center lg:text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Today
            </p>
            <p className="mt-1.5 flex min-h-5 items-baseline justify-center gap-2 lg:justify-start">
              <span className="text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
                {ready ? todayTotalLabel : "—"}
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                / {goalLabel}
              </span>
            </p>
          </div>

          {!compact ? (
            <>
              {story ? (
                <p className="text-center text-sm leading-snug text-foreground/90 lg:text-left">
                  {story}
                </p>
              ) : null}

              {canContinue ? (
                <div className="text-center lg:text-left">
                  <button
                    type="button"
                    onClick={() => start()}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    <Play className="size-3.5 fill-current" />
                    Continue · {formatFocusDuration(sessionSeconds)}
                  </button>
                  {pickupHint ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {pickupHint}
                    </p>
                  ) : null}
                </div>
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

              <div className="w-full border-t border-border/30 pt-5">
                <p className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground lg:text-left">
                  This week
                </p>
                <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
                  {weekDays.map((day) => {
                    const height =
                      day.minutes <= 0
                        ? 6
                        : Math.max(
                            6,
                            Math.round((day.minutes / weekScale) * 100),
                          );
                    const today = isToday(day.date);
                    const minuteLabel =
                      day.minutes > 0
                        ? formatFocusMinutesCompact(day.minutes)
                        : today
                          ? "0m"
                          : "";
                    return (
                      <div
                        key={day.date}
                        className="flex min-w-0 flex-col items-center gap-1.5"
                        title={`${formatFocusMinutes(day.minutes)} focused`}
                      >
                        <div className="relative flex h-14 w-full items-end rounded-lg bg-muted/30 px-1 pb-1 sm:h-16">
                          {goalLinePct > 8 && goalLinePct < 96 ? (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-x-1 border-t border-dashed border-foreground/25"
                              style={{ bottom: `${goalLinePct}%` }}
                            />
                          ) : null}
                          <div
                            className={cn(
                              "relative w-full min-h-[3px] rounded-[3px] bg-foreground/70 transition-all duration-500",
                              today && "focus-week-today bg-foreground",
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
                        <span
                          className={cn(
                            "h-3 text-[10px] leading-none tabular-nums text-muted-foreground/80",
                            today && "text-foreground/80",
                            !minuteLabel && "opacity-0",
                          )}
                        >
                          {minuteLabel || "0"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {pace ? (
                  <p className="mt-3 text-center text-[11px] text-muted-foreground lg:text-left">
                    {pace}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex items-baseline justify-between gap-3 border-t border-border/30 pt-3.5 text-xs text-muted-foreground">
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
              {liveFocus
                ? "Sky live"
                : canContinue
                  ? "Continue ready"
                  : "Day taking shape"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
