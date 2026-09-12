"use client";

import { useEffect, useState } from "react";

import { DashboardFocusCta } from "@/components/dashboard/dashboard-focus-cta";

type DashboardWelcomeProps = {
  name: string;
  greeting: string;
  intent: string | null;
};

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function DashboardWelcome({
  name,
  greeting,
  intent,
}: DashboardWelcomeProps) {
  const [dateLabel, setDateLabel] = useState("");
  const story = intent?.trim() || null;

  useEffect(() => {
    setDateLabel(formatTodayLabel(new Date()));
  }, []);

  return (
    <header className="dash-welcome flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs tabular-nums text-muted-foreground">
          {dateLabel || "\u00a0"}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greeting}, {name}
        </h2>
        {story ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {story}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Here&apos;s your day at a glance.
          </p>
        )}
      </div>
      <div className="shrink-0 self-start sm:self-end">
        <DashboardFocusCta />
      </div>
    </header>
  );
}
