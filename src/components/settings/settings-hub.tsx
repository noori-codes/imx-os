"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  BellOff,
  Camera,
  Copy,
  Download,
  KeyRound,
  Keyboard,
  Moon,
  Monitor,
  Sun,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { exportUserData, importUserData } from "@/actions/data-transfer";
import {
  removeAvatar,
  updateDisplayName,
  updateUserSettings,
  uploadAvatar,
} from "@/actions/settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { useUser } from "@/components/providers/user-provider";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { AvatarCropDialog } from "@/components/settings/avatar-crop-dialog";
import { SettingsPulse } from "@/components/settings/settings-pulse";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  playFocusChime,
  requestFocusNotifyPermission,
} from "@/lib/focus-alerts";
import { DISPLAY_NAME_MAX } from "@/lib/display-name";
import { imxToast } from "@/lib/imx-toast";
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
  displayName: string;
  hasCustomAvatar: boolean;
  memberSince: string;
  memberShort: string;
  settings: UserSettings;
};

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="settings-panel scroll-mt-20 rounded-[1.35rem] imx-surface imx-surface-rim p-4 sm:p-5"
    >
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
                  ? "bg-foreground text-background dark:bg-foreground/12 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
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
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          checked ? "bg-foreground" : "bg-muted ring-1 ring-border/50",
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
  displayName,
  hasCustomAvatar: initialHasCustomAvatar,
  memberSince,
  memberShort,
  settings,
}: SettingsHubProps) {
  const router = useRouter();
  const { setAvatarUrl, setName } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [, startTransition] = useTransition();
  const setAutoStartNext = useFocusTimer((s) => s.setAutoStartNext);
  const setClock = useFocusTimer((s) => s.setClock);
  const applyProfile = useFocusTimer((s) => s.applyProfile);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [nameSaved, setNameSaved] = useState(displayName);
  const [namePending, setNamePending] = useState(false);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(initialHasCustomAvatar);
  const [avatarPending, setAvatarPending] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
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
  const [modKey, setModKey] = useState("⌘");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setModKey(isApple ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    setNameDraft(displayName);
    setNameSaved(displayName);
  }, [displayName]);

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

  useEffect(() => {
    function scrollToHash() {
      const id = window.location.hash.replace(/^#/, "");
      if (!id.startsWith("settings-")) return;
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
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

  useEffect(() => {
    setHasCustomAvatar(initialHasCustomAvatar);
  }, [initialHasCustomAvatar]);

  useEffect(() => {
    if (!cropFile) {
      setCropSrc(null);
      return;
    }
    const url = URL.createObjectURL(cropFile);
    setCropSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [cropFile]);

  function closeCropEditor() {
    setCropOpen(false);
    setCropFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function saveName() {
    const next = nameDraft.trim().replace(/\s+/g, " ");
    if (!next) {
      imxToast("Enter a name", { tone: "error" });
      return;
    }
    if (next === nameSaved) return;
    setNamePending(true);
    try {
      const result = await updateDisplayName(next);
      if (result.error) {
        imxToast(result.error, { tone: "error" });
        return;
      }
      const saved = result.name ?? next;
      setNameDraft(saved);
      setNameSaved(saved);
      setName(saved);
      imxToast("Name updated", { tone: "success" });
      router.refresh();
    } finally {
      setNamePending(false);
    }
  }

  function handleAvatarPick(file: File | undefined) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      imxToast("Use JPG, PNG, WebP, or GIF.", { tone: "error" });
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    // Source can be larger; we export a compressed JPEG under the upload limit.
    if (file.size > 12 * 1024 * 1024) {
      imxToast("Keep the source photo under 12 MB.", { tone: "error" });
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    setCropFile(file);
    setCropOpen(true);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleCropSave(file: File) {
    setAvatarPending(true);
    try {
      const body = new FormData();
      body.set("avatar", file);
      const result = await uploadAvatar(body);
      if (result.error) {
        imxToast(result.error, { tone: "error" });
        return;
      }
      setHasCustomAvatar(true);
      if (result.url) setAvatarUrl(result.url);
      closeCropEditor();
      imxToast("Photo updated", { tone: "success" });
      router.refresh();
    } finally {
      setAvatarPending(false);
    }
  }

  async function handleAvatarRemove() {
    const ok = await confirm({
      title: "Remove photo?",
      description: "Your avatar will fall back to your sign-in photo or initials.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setAvatarPending(true);
    try {
      const result = await removeAvatar();
      if (result.error) {
        imxToast(result.error, { tone: "error" });
        return;
      }
      setHasCustomAvatar(false);
      imxToast("Photo removed", { tone: "success" });
      router.refresh();
    } finally {
      setAvatarPending(false);
    }
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
        imxToast("Export failed", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      downloadJson(exportFilename(), result.payload);
      setTransferMsg("Export downloaded.");
      imxToast("Export downloaded", {
        description: "Your backup JSON is ready.",
        tone: "success",
      });
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
        imxToast("Import failed", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      setTransferMsg(`Imported ${result.imported} records.`);
      imxToast("Import complete", {
        description: `Merged ${result.imported} records into your account.`,
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import failed.";
      setTransferError(message);
      imxToast("Import failed", {
        description: message,
        tone: "error",
      });
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
      <SettingsPulse
        displayName={nameSaved}
        themeLabel={themeLabel}
        focusGoalLabel={formatFocusMinutesCompact(goal) || `${goal}m`}
        focusGoalMinutes={goal}
        notifyLabel={notifyLabel}
        memberLabel={memberShort}
        memberSince={memberSince}
        synced={settings.saved}
      />

      <Section
        id="settings-account"
        title="Profile"
        description="How you show up across IMX OS."
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <button
              type="button"
              disabled={avatarPending}
              onClick={() => avatarInputRef.current?.click()}
              className={cn(
                "group relative size-32 shrink-0 overflow-hidden rounded-full outline-none transition-transform",
                "ring-1 ring-border/60 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
              aria-label={
                hasCustomAvatar ? "Change profile photo" : "Upload profile photo"
              }
            >
              <UserAvatar
                size={128}
                className="size-full border-0 text-2xl tracking-wide"
              />
              <span
                className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/35 group-focus-visible:bg-foreground/35"
                aria-hidden
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2",
                  "bg-foreground/70 text-[11px] font-medium tracking-wide text-background",
                  "opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100",
                )}
              >
                <Camera className="size-3.5" />
                {hasCustomAvatar ? "Change" : "Upload"}
              </span>
              {avatarPending ? (
                <span className="absolute inset-0 bg-background/50" aria-hidden />
              ) : null}
            </button>
            {hasCustomAvatar ? (
              <button
                type="button"
                disabled={avatarPending}
                onClick={() => void handleAvatarRemove()}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                Remove photo
              </button>
            ) : (
              <p className="max-w-[11rem] text-center text-[11px] leading-relaxed text-muted-foreground sm:text-left">
                Drag to crop · JPG, PNG, WebP, or GIF
              </p>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                void handleAvatarPick(e.target.files?.[0]);
              }}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label
                htmlFor="settings-display-name"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Display name
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="settings-display-name"
                  value={nameDraft}
                  maxLength={DISPLAY_NAME_MAX}
                  autoComplete="nickname"
                  placeholder="How you want to be greeted"
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveName();
                    }
                  }}
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0"
                  disabled={
                    namePending ||
                    nameDraft.trim().replace(/\s+/g, " ") === nameSaved
                  }
                  onClick={() => void saveName()}
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Email
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-foreground">
                    {email}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    aria-label="Copy email"
                    onClick={() => {
                      void (async () => {
                        try {
                          await navigator.clipboard.writeText(email);
                          imxToast("Email copied", { tone: "success" });
                        } catch {
                          imxToast("Couldn’t copy email", { tone: "error" });
                        }
                      })();
                    }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Member since
                </p>
                <p className="mt-1.5 text-sm text-foreground">{memberSince}</p>
              </div>
            </div>

            <div className="pt-1">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/update-password">
                  <KeyRound className="size-3.5" />
                  Change password
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-border/40 pt-5">
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

      <Section
        id="settings-appearance"
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
                    ? "border-foreground/30 bg-foreground text-background dark:border-foreground/25 dark:bg-foreground/12 dark:text-foreground"
                    : "border-border/50 bg-muted/30 text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                <span className="text-sm font-medium">{option.label}</span>
                {option.id === "system" && mounted && resolvedTheme ? (
                  <span
                    className={cn(
                      "ml-auto text-[10px] uppercase tracking-wide",
                      active
                        ? "text-background/70 dark:text-foreground/55"
                        : "text-muted-foreground",
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
        id="settings-focus"
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
                        ? "bg-foreground text-background dark:bg-foreground/12 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
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
        id="settings-alerts"
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
        id="settings-capture"
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
        id="settings-shortcuts"
        title="Shortcuts"
        description="Keyboard habits that work across capture surfaces."
      >
        <ul className="space-y-2.5">
          {[
            {
              keys: "C",
              action:
                "Open Quick Capture — save a task, note, journal, habit, or event from anywhere",
            },
            {
              keys: "N",
              action:
                "Focus or open the page’s primary capture (task, habit, note, book…)",
            },
            {
              keys: "/",
              action: "Open search when the palette is closed",
            },
            {
              keys: `${modKey}K`,
              action: "Toggle search and the command palette",
            },
            {
              keys: `${modKey}⇧I`,
              action: "Open or close the IMX coach",
            },
            {
              keys: "← / →",
              action: "Move the selected day on Calendar",
            },
            {
              keys: "T",
              action: "Jump to today on Calendar",
            },
            {
              keys: "Type in palette",
              action:
                "Run Actions — Add task, Ask IMX, New note, Add habit, Add event…",
            },
            { keys: "Enter", action: "Save an inline edit" },
            { keys: "Esc", action: "Cancel an inline edit · close the palette" },
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

      {prefError ? (
        <p className="text-center text-sm text-destructive">{prefError}</p>
      ) : null}

      <p className="text-center text-[11px] text-muted-foreground">
        imx-os · theme, focus defaults, and task view sync to your account ·
        volume and browser alerts stay on this device
      </p>

      <AvatarCropDialog
        imageSrc={cropSrc}
        open={cropOpen}
        pending={avatarPending}
        onOpenChange={(next) => {
          if (!next) closeCropEditor();
          else setCropOpen(true);
        }}
        onSave={handleCropSave}
      />
    </div>
  );
}
