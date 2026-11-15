"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon } from "lucide-react";

import { DashboardFocusCta } from "@/components/dashboard/dashboard-focus-cta";
import { SectionReveal } from "@/components/motion/section-reveal";
import { cn } from "@/lib/utils";

type DashboardHomeHeaderProps = {
  name: string;
  greeting: string;
  intent: string | null;
  hasTodayReview: boolean;
};

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Editorial masthead — date, greeting, one primary CTA. KPIs live below. */
export function DashboardHomeHeader({
  name,
  greeting,
  intent,
  hasTodayReview,
}: DashboardHomeHeaderProps) {
  const [dateLabel, setDateLabel] = useState("");
  const story = intent?.trim() || null;

  useEffect(() => {
    setDateLabel(formatTodayLabel());
  }, []);

  return (
    <SectionReveal emphasize>
      <header className="dash-masthead">
        <div className="dash-masthead-top">
          <div className="min-w-0 flex-1">
            <p className="dash-masthead-meta">
              <span className="dash-masthead-live" aria-hidden />
              <span suppressHydrationWarning>{dateLabel || "\u00a0"}</span>
            </p>
            <h2 className="dash-masthead-title">
              {greeting}, <span className="dash-masthead-name">{name}</span>
            </h2>
            <p className="dash-masthead-story">
              {story || "Your day, one clear desk."}
            </p>
          </div>

          <div className="dash-masthead-actions">
            <DashboardFocusCta />
            <Link
              href="/review"
              className={cn(
                "dash-masthead-secondary",
                hasTodayReview && "dash-masthead-secondary-muted",
              )}
            >
              <Moon className="size-3.5 opacity-70" aria-hidden />
              {hasTodayReview ? "Reviewed" : "Review"}
            </Link>
          </div>
        </div>
      </header>
    </SectionReveal>
  );
}
