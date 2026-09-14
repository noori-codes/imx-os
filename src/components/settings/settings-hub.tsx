"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  BellOff,
  Download,
  Keyboard,
  Moon,
  Monitor,
  Sun,
  Upload,
  Volume2,
} from "lucide-react";

import { exportUserData, importUserData } from "@/actions/data-transfer";
import { updateUserSettings } from "@/actions/settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { SettingsStats } from "@/components/settings/settings-stats";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  playFocusChime,
  requestFocusNotifyPermission,
} from "@/lib/focus-alerts";
import {
  PREF_AUTO_START,
  PREF_CELEBRATE,
  PREF_CHIME,
  readBoolPref,
  readDefaultTaskView,
  readFocusClockPref,
  readFocusProfilePref,
  writeBoolPref,
  writeDefaultTaskView,
  writeFocusClockPref,
  writeFocusProfilePref,
} from "@/lib/app-preferences";
import {
  downloadJson,
  exportFilename,
  readJsonFile,
} from "@/lib/data-transfer";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  FOCUS_PROFILES,
  formatFocusMinutesCompact,
  type FocusClock,
  type FocusProfileId,
} from "@/types/focus";
import type { AppThemePref, UserSettings } from "@/types/settings";
import { TASK_VIEWS, type TaskView } from "@/types/task";

type SettingsHubProps = {
  email: string;
  memberSince: string;
  memberShort: string;
  settings: UserSettings;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-panel rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

function ChoiceRow<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={option.hint}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-background shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export function SettingsHub({
  email,
  memberSince,
  memberShort,
  settings,
}: SettingsHubProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [, startTransition] = useTransition();
  const setAutoStartNext = useFocusTimer((s) => s.setAutoStartNext);
  const setClock = useFocusTimer((s) => s.setClock);
  const applyProfile = useFocusTimer((s) => s.applyProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [goal, setGoal] = useState(settings.daily_focus_goal_minutes);
  const [goalCustom, setGoalCustom] = useState(
    String(settings.daily_focus_goal_minutes),
  );
  const [goalError, setGoalError] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferPending, setTransferPending] = useState(false);
  const [autoStart, setAutoStart] = useState(settings.auto_start_next);
  const [clock, setClockLocal] = useState<FocusClock>(settings.focus_clock);
  const [profile, setProfile] = useState<FocusProfileId>(settings.focus_profile);
  const [chime, setChime] = useState(settings.chime_enabled);
  const [celebrate, setCelebrate] = useState(settings.celebrate_enabled);
  const [defaultView, setDefaultView] = useState<TaskView>(
    settings.default_task_view,
  );
  const [notify, setNotify] = useState<"unsupported" | NotificationPermission>(
    "default",
  );

  useEffect(() => {
    setMounted(true);

    if (settings.saved) {
      setAutoStart(settings.auto_start_next);
      setClockLocal(settings.focus_clock);
      setProfile(settings.focus_profile);
      setChime(settings.chime_enabled);
      setCelebrate(settings.celebrate_enabled);
      setDefaultView(settings.default_task_view);
      writeBoolPref(PREF_AUTO_START, settings.auto_start_next);
      writeFocusClockPref(settings.focus_clock);
      writeFocusProfilePref(settings.focus_profile);
      writeBoolPref(PREF_CHIME, settings.chime_enabled);
      writeBoolPref(PREF_CELEBRATE, settings.celebrate_enabled);
      writeDefaultTaskView(settings.default_task_view);
      setTheme(settings.theme);
      setAutoStartNext(settings.auto_start_next);
      setClock(settings.focus_clock);
      applyProfile(settings.focus_profile);
    } else {
      setAutoStart(readBoolPref(PREF_AUTO_START, false));
      setClockLocal(readFocusClockPref());
      setProfile(readFocusProfilePref());
      setChime(readBoolPref(PREF_CHIME, true));
      setCelebrate(readBoolPref(PREF_CELEBRATE, true));
      setDefaultView(readDefaultTaskView());
    }

    if (typeof Notification === "undefined") {
      setNotify("unsupported");
    } else {
      setNotify(Notification.permission);
    }
    // Hydrate once from server props / local cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(patch: Parameters<typeof updateUserSettings>[0]) {
    setPrefError(null);
    startTransition(async () => {
      const result = await updateUserSettings(patch);
      if (result.error) setPrefError(result.error);
    });
  }

  function saveGoal(minutes: number) {
    const next = clampDailyFocusGoal(minutes);
    setGoal(next);
    setGoalCustom(String(next));
    setGoalError(null);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(next));
    startTransition(async () => {
      const result = await updateUserSettings({
        daily_focus_goal_minutes: next,
      });
      if (result.error) setGoalError(result.error);
    });
  }

  async function enableNotifications() {
    await requestFocusNotifyPermission();
    if (typeof Notification !== "undefined") {
      setNotify(Notification.permission);
    }
  }

  async function handleExport() {
    setTransferError(null);
    setTransferMsg(null);
    setTransferPending(true);
    try {
      const result = await exportUserData();
      if (!result.ok) {
        setTransferError(result.error);
        return;
      }
      downloadJson(exportFilename(), result.payload);
      setTransferMsg("Export downloaded.");
    } finally {
      setTransferPending(false);
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;
    setTransferError(null);
    setTransferMsg(null);

    const ok = await confirm({
      title: "Import this backup?",
      description:
        "Matching items merge by id into your account. This cannot be undone easily.",
      confirmLabel: "Import",
      destructive: true,
    });
    if (!ok) return;

    setTransferPending(true);
    try {
      const payload = await readJsonFile(file);
      const result = await importUserData(payload);
      if (!result.ok) {
        setTransferError(result.error);
        return;
      }
      setTransferMsg(`Imported ${result.imported} records.`);
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : "Import failed.",
      );
    } finally {
      setTransferPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const themeLabel = !mounted
    ? "—"
    : theme === "system"
      ? "System"
      : theme === "dark"
        ? "Dark"
        : "Light";

  const notifyLabel =
    notify === "unsupported"
      ? "N/A"
      : notify === "granted"
        ? "On"
        : notify === "denied"
          ? "Off"
          : "Ask";

  return (
    <div className="flex flex-col gap-6">
      <SettingsStats
        themeLabel={themeLabel}
        focusGoalLabel={formatFocusMinutesCompact(goal) || `${goal}m`}
        notifyLabel={notifyLabel}
        memberLabel={memberShort}
      />

      <Section
        title="Appearance"
        description="How imx-os looks — synced to your account."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const active = mounted && theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTheme(option.id);
                  persist({ theme: option.id satisfies AppThemePref });
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border/50 bg-muted/30 text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                <span className="text-sm font-medium">{option.label}</span>
                {option.id === "system" && mounted && resolvedTheme ? (
                  <span
                    className={cn(
                      "ml-auto text-[10px] uppercase tracking-wide",
                      active ? "text-background/70" : "text-muted-foreground",
                    )}
                  >
                    {resolvedTheme}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Focus"
        description="Defaults for the timer, daily goal, and session flow."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                Daily focus goal
              </p>
              <p className="text-xs text-muted-foreground">
                {settings.saved || goal ? "Synced" : "Default"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FOCUS_DAILY_GOAL_PRESETS.map((preset) => {
                const active = goal === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => saveGoal(preset.minutes)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="number"
                min={15}
                max={720}
                step={5}
                value={goalCustom}
                onChange={(e) => setGoalCustom(e.target.value)}
                onBlur={() => {
                  const parsed = Number(goalCustom);
                  if (Number.isFinite(parsed)) saveGoal(parsed);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const parsed = Number(goalCustom);
                    if (Number.isFinite(parsed)) saveGoal(parsed);
                  }
                }}
                className="h-9 w-28"
                aria-label="Custom daily focus goal minutes"
              />
              <span className="text-xs text-muted-foreground">minutes / day</span>
            </div>
            {goalError ? (
              <p className="text-sm text-destructive">{goalError}</p>
            ) : null}
          </div>

          <ChoiceRow
            label="Timer profile"
            hint="Applied on next focus visit"
            value={profile}
            options={FOCUS_PROFILES.map((item) => ({
              id: item.id,
              label: item.label,
              hint: item.hint,
            }))}
            onChange={(next) => {
              setProfile(next);
              writeFocusProfilePref(next);
              applyProfile(next);
              persist({ focus_profile: next });
            }}
          />

          <ChoiceRow
            label="Clock mode"
            value={clock}
            options={[
              { id: "down", label: "Countdown", hint: "Timed blocks" },
              { id: "up", label: "Count up", hint: "Until you stop" },
            ]}
            onChange={(next) => {
              setClockLocal(next);
              writeFocusClockPref(next);
              setClock(next);
              persist({ focus_clock: next });
            }}
          />

          <ToggleRow
            label="Auto-start next phase"
            description="When a block ends, start the next one automatically."
            checked={autoStart}
            onChange={(next) => {
              setAutoStart(next);
              writeBoolPref(PREF_AUTO_START, next);
              setAutoStartNext(next);
              persist({ auto_start_next: next });
            }}
          />

          <ToggleRow
            label="Session chime"
            description="Play a soft tone when a focus phase ends."
            checked={chime}
            onChange={(next) => {
              setChime(next);
              writeBoolPref(PREF_CHIME, next);
              persist({ chime_enabled: next });
            }}
          />

          <ToggleRow
            label="Celebrations"
            description="Confetti and seals when you hit big focus milestones."
            checked={celebrate}
            onChange={(next) => {
              setCelebrate(next);
              writeBoolPref(PREF_CELEBRATE, next);
              persist({ celebrate_enabled: next });
            }}
          />

          <div className="space-y-2 border-t border-border/40 pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Atmosphere</p>
              <p className="text-xs text-muted-foreground">
                Ambient while focusing · this device
              </p>
            </div>
            <FocusSounds embedded />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => playFocusChime()}
              disabled={!chime}
            >
              <Volume2 className="size-3.5" />
              Test chime
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Notifications"
        description="Browser alerts when a focus phase finishes (this device only)."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {notify === "granted" ? (
              <Bell className="mt-0.5 size-4 text-foreground" />
            ) : (
              <BellOff className="mt-0.5 size-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {notify === "unsupported"
                  ? "Not supported here"
                  : notify === "granted"
                    ? "Notifications allowed"
                    : notify === "denied"
                      ? "Blocked in the browser"
                      : "Permission not decided"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {notify === "denied"
                  ? "Re-enable from your browser site settings."
                  : "Used for focus phase changes only."}
              </p>
            </div>
          </div>
          {notify === "default" || notify === "denied" ? (
            <Button
              type="button"
              size="sm"
              variant={notify === "denied" ? "outline" : "default"}
              onClick={() => void enableNotifications()}
              disabled={notify === "denied"}
            >
              {notify === "denied" ? "Blocked" : "Allow alerts"}
            </Button>
          ) : null}
        </div>
      </Section>

      <Section
        title="Capture"
        description="Defaults for how you land in Tasks."
      >
        <ChoiceRow
          label="Default tasks view"
          hint="When you open /tasks with no view"
          value={defaultView}
          options={TASK_VIEWS.map((item) => ({
            id: item.id,
            label: item.label,
          }))}
          onChange={(next) => {
            setDefaultView(next);
            writeDefaultTaskView(next);
            persist({ default_task_view: next });
          }}
        />
      </Section>

      <Section
        title="Shortcuts"
        description="Keyboard habits that work across capture surfaces."
      >
        <ul className="space-y-2.5">
          {[
            {
              keys: "N",
              action: "Focus the new item field (tasks, habits, goals…)",
            },
            { keys: "Enter", action: "Save an inline edit" },
            { keys: "Esc", action: "Cancel an inline edit" },
            { keys: "⌘K", action: "Open search and command palette" },
          ].map((row) => (
            <li
              key={row.keys}
              className="flex items-start gap-3 text-sm text-muted-foreground"
            >
              <Keyboard className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                  {row.keys}
                </kbd>
                <span className="ml-2">{row.action}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Account"
        description="Identity, backup, and session on this device."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </p>
            <p className="mt-1.5 text-sm text-foreground">{email}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Member since
            </p>
            <p className="mt-1.5 text-sm text-foreground">{memberSince}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 border-t border-border/40 pt-4">
          <p className="text-sm font-medium text-foreground">Data backup</p>
          <p className="text-xs text-muted-foreground">
            Download a JSON snapshot of your goals, tasks, habits, notes, focus
            history, and more — or merge a backup back in.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={transferPending}
              onClick={() => void handleExport()}
            >
              <Download className="size-3.5" />
              Export JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={transferPending}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void handleImportFile(event.target.files?.[0] ?? null);
              }}
            />
          </div>
          {transferMsg ? (
            <p className="text-sm text-muted-foreground">{transferMsg}</p>
          ) : null}
          {transferError ? (
            <p className="text-sm text-destructive">{transferError}</p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
          <p className="text-sm text-muted-foreground">End this device session</p>
          <SignOutButton variant="outline" />
        </div>
      </Section>

      {prefError ? (
        <p className="text-center text-sm text-destructive">{prefError}</p>
      ) : null}

      <p className="text-center text-[11px] text-muted-foreground">
        imx-os · theme, focus defaults, and task view sync to your account ·
        volume and browser alerts stay on this device
      </p>
    </div>
  );
}
