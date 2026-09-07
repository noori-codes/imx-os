"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";

import { updateDailyFocusGoal } from "@/actions/focus";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  BREAK_DURATION_PRESETS,
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  FOCUS_DURATION_PRESETS,
  FOCUS_MAX_SECONDS,
  FOCUS_PRESETS,
  FOCUS_PROFILES,
  formatFocusClock,
  formatFocusMinutes,
  type FocusClock,
  type FocusMode,
} from "@/types/focus";

const MODES: FocusMode[] = ["focus", "short_break", "long_break"];
const CLOCKS: { id: FocusClock; label: string; hint: string }[] = [
  { id: "down", label: "Countdown", hint: "Timed blocks" },
  { id: "up", label: "Count up", hint: "Until you stop" },
];

function readGoalMinutes() {
  if (typeof window === "undefined") return FOCUS_DAILY_GOAL_DEFAULT;
  const raw = window.localStorage.getItem(FOCUS_DAILY_GOAL_KEY);
  if (raw == null) return FOCUS_DAILY_GOAL_DEFAULT;
  const value = Number(raw);
  if (!Number.isFinite(value)) return FOCUS_DAILY_GOAL_DEFAULT;
  return clampDailyFocusGoal(value);
}

type FocusSettingsProps = {
  dailyGoalMinutes?: number;
  onClockChange: (next: FocusClock) => void;
  /** Extra class on the trigger button. */
  className?: string;
  align?: "center" | "start";
};

export function FocusSettings({
  dailyGoalMinutes = FOCUS_DAILY_GOAL_DEFAULT,
  onClockChange,
  className,
  align = "center",
}: FocusSettingsProps) {
  const router = useRouter();
  const mode = useFocusTimer((s) => s.mode);
  const clock = useFocusTimer((s) => s.clock);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const autoStartNext = useFocusTimer((s) => s.autoStartNext);
  const profileId = useFocusTimer((s) => s.profileId);
  const setMode = useFocusTimer((s) => s.setMode);
  const setDuration = useFocusTimer((s) => s.setDuration);
  const setAutoStartNext = useFocusTimer((s) => s.setAutoStartNext);
  const applyProfile = useFocusTimer((s) => s.applyProfile);

  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [goalMinutes, setGoalMinutes] = useState(dailyGoalMinutes);
  const [, startGoalTransition] = useTransition();

  const isStopwatch = clock === "up";
  const durationMinutes = Math.round(durationSeconds / 60);
  const durationPresets =
    mode === "focus" ? FOCUS_DURATION_PRESETS : BREAK_DURATION_PRESETS[mode];
  const presetMatch = durationPresets.some(
    (preset) => preset.minutes === durationMinutes,
  );
  const activeProfile =
    FOCUS_PROFILES.find((profile) => profile.id === profileId) ?? null;

  const summary = isStopwatch
    ? "Count up"
    : [
        activeProfile?.label ?? "Custom",
        formatFocusMinutes(durationMinutes),
      ].join(" · ");

  useEffect(() => {
    setGoalMinutes(readGoalMinutes());
  }, [dailyGoalMinutes]);

  useEffect(() => {
    const hours = Number(customHours || 0);
    const minutes = Number(customMinutes || 0);
    if (!customHours && !customMinutes) return;
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
    const seconds = Math.round(hours * 3600 + minutes * 60);
    if (seconds < 60 || seconds > FOCUS_MAX_SECONDS) return;
    setDuration(seconds);
  }, [customHours, customMinutes, setDuration]);

  function updateGoal(minutes: number) {
    const next = clampDailyFocusGoal(minutes);
    setGoalMinutes(next);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(next));
    startGoalTransition(async () => {
      await updateDailyFocusGoal(next);
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
            align === "start" ? "justify-start" : "justify-center",
            className,
          )}
        >
          <Settings2 className="size-3.5 shrink-0" />
          <span className="tabular-nums max-sm:text-xs">
            Settings · {summary}
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[min(88vh,40rem)] gap-0 overflow-y-auto rounded-t-2xl border-border/60 p-0 sm:max-w-lg sm:mx-auto sm:inset-x-0 sm:left-1/2 sm:-translate-x-1/2"
      >
        <SheetHeader className="border-b border-border/40 pb-4 pt-5">
          <SheetTitle>Focus settings</SheetTitle>
          <SheetDescription>
            Session setup, daily goal, and atmosphere.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-4 py-5 pb-8">
          <section className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Clock
            </p>
            <div
              className="flex w-full justify-center gap-1 rounded-full bg-muted/30 p-1"
              role="tablist"
              aria-label="Clock style"
            >
              {CLOCKS.map((item) => {
                const active = clock === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onClockChange(item.id)}
                    className={cn(
                      "min-w-0 flex-1 rounded-full px-3 py-2 text-left transition-colors sm:text-center",
                      active
                        ? "bg-background font-medium text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="block text-sm">{item.label}</span>
                    <span
                      className={cn(
                        "block text-[11px]",
                        active
                          ? "text-foreground/60"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            {isStopwatch ? (
              <p className="text-xs text-muted-foreground">
                Starts at 00:00 · R seals when done · ↺ discards
              </p>
            ) : null}
          </section>

          {!isStopwatch ? (
            <section className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Session
              </p>
              <div className="grid grid-cols-3 gap-2">
                {FOCUS_PROFILES.map((profile) => {
                  const active = profileId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setCustomHours("");
                        setCustomMinutes("");
                        applyProfile(profile.id);
                      }}
                      className={cn(
                        "rounded-xl px-2.5 py-2 text-left transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                      aria-pressed={active}
                    >
                      <span className="block text-sm font-medium">
                        {profile.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] tabular-nums",
                          active
                            ? "text-background/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {profile.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="flex w-full justify-center gap-1 rounded-full bg-muted/30 p-1"
                role="tablist"
                aria-label="Timer mode"
              >
                {MODES.map((m) => {
                  const isActive = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setCustomHours("");
                        setCustomMinutes("");
                        setMode(m);
                      }}
                      className={cn(
                        "min-w-0 flex-1 rounded-full px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-background font-medium text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {FOCUS_PRESETS[m].label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {durationPresets.map((preset) => {
                  const active =
                    !customHours &&
                    !customMinutes &&
                    durationMinutes === preset.minutes;
                  return (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => {
                        setCustomHours("");
                        setCustomMinutes("");
                        setDuration(preset.minutes * 60);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm tabular-nums transition-colors",
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

              {mode === "focus" ? (
                <div className="flex items-center gap-2 text-sm">
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    inputMode="numeric"
                    placeholder="hrs"
                    aria-label="Custom hours"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="h-9 w-16 rounded-xl border-border/40 bg-transparent text-center"
                  />
                  <span className="text-muted-foreground">:</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    placeholder="min"
                    aria-label="Custom minutes"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="h-9 w-16 rounded-xl border-border/40 bg-transparent text-center"
                  />
                  {!presetMatch && !customHours && !customMinutes ? (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatFocusClock(durationSeconds)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setAutoStartNext(!autoStartNext)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  autoStartNext
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                Auto-start {autoStartNext ? "on" : "off"}
              </button>
            </section>
          ) : null}

          <section className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Daily goal
            </p>
            <div className="flex flex-wrap gap-1.5">
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
            <p className="text-xs text-muted-foreground">
              Target · {formatFocusMinutes(goalMinutes)} focused today
            </p>
          </section>

          <section className="space-y-3">
            <FocusSounds />
          </section>

          <section className="space-y-2 border-t border-border/40 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Shortcuts
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Space · play/pause
              <br />
              {isStopwatch
                ? "R · seal · ↺ discard"
                : "S · skip · R · reset"}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
