"use client";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";

type SettingsPulseProps = {
  email: string;
  themeLabel: string;
  focusGoalLabel: string;
  focusGoalMinutes: number;
  notifyLabel: string;
  memberLabel: string;
  memberSince: string;
  synced: boolean;
};

const JUMPS = [
  { href: "#settings-appearance", label: "Look" },
  { href: "#settings-focus", label: "Focus" },
  { href: "#settings-alerts", label: "Alerts" },
  { href: "#settings-account", label: "Account" },
] as const;

function pulseCopy({
  email,
  synced,
  notifyLabel,
}: {
  email: string;
  synced: boolean;
  notifyLabel: string;
}) {
  const handle = email.includes("@") ? email.split("@")[0] : email;
  if (!synced) {
    return {
      title: "Fresh control room",
      body: "Defaults are local for now — change anything below to sync prefs to your account.",
      sealed: false,
    };
  }
  return {
    title: handle || "Your OS",
    body: `Prefs synced · alerts ${notifyLabel.toLowerCase()} · tune appearance, focus, and backups below.`,
    sealed: notifyLabel === "On",
  };
}

export function SettingsPulse({
  email,
  themeLabel,
  focusGoalLabel,
  focusGoalMinutes,
  notifyLabel,
  memberLabel,
  memberSince,
  synced,
}: SettingsPulseProps) {
  const copy = pulseCopy({ email, synced, notifyLabel });
  const ringValue = Math.max(
    0,
    Math.min(100, Math.round((focusGoalMinutes / 240) * 100)),
  );

  return (
    <section
      className={cn(
        "settings-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8",
        copy.sealed && "settings-pulse-sealed",
      )}
    >
      <div className="settings-pulse-vignette" aria-hidden />
      <div className="settings-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Control room
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Settings
            </h2>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end"
            aria-label="Jump to section"
          >
            {JUMPS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex h-9 items-center rounded-xl border border-border/55 bg-background/50 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
              {copy.body}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Member since {memberSince}
            </p>

            <div className="settings-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Theme
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {themeLabel}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Alerts
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {notifyLabel}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Since
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {memberLabel}
                </p>
              </div>
            </div>
          </div>

          <ProgressRing
            value={ringValue}
            size={128}
            stroke={7}
            sealed={copy.sealed}
            featured
            className="mx-auto sm:mx-0"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {focusGoalLabel}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                daily
              </p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
