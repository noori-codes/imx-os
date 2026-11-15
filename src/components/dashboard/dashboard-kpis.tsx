"use client";

import Link from "next/link";
import { Flame } from "lucide-react";

import {
  REVEAL_DELAY,
  SectionReveal,
  StaggerItem,
  StaggerList,
} from "@/components/motion/section-reveal";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardKpisProps = {
  dueOpen: number;
  overdue: number;
  habitsDone: number;
  habitsTotal: number;
  focusMinutes: number;
  focusGoalMinutes: number;
  streak: number;
};

type Kpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  meter?: number;
  tone?: "default" | "warn" | "live" | "sealed";
};

/** Equal KPI tiles — 4-up with optional progress meters. */
export function DashboardKpis({
  dueOpen,
  overdue,
  habitsDone,
  habitsTotal,
  focusMinutes,
  focusGoalMinutes,
  streak,
}: DashboardKpisProps) {
  const habitClear = habitsTotal > 0 && habitsDone === habitsTotal;
  const habitPct =
    habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;
  const focusPct =
    focusGoalMinutes > 0
      ? Math.min(100, Math.round((focusMinutes / focusGoalMinutes) * 100))
      : 0;
  const focusSealed = focusGoalMinutes > 0 && focusMinutes >= focusGoalMinutes;

  const items: Kpi[] = [
    {
      id: "tasks",
      label: "Open today",
      value: dueOpen > 0 ? String(dueOpen) : "0",
      hint:
        overdue > 0
          ? `${overdue} overdue`
          : dueOpen === 0
            ? "All clear"
            : "On the desk",
      href: "/tasks?view=today",
      tone: overdue > 0 ? "warn" : dueOpen === 0 ? "sealed" : "default",
    },
    {
      id: "habits",
      label: "Habits",
      value: habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—",
      hint: habitClear
        ? "Day sealed"
        : habitsTotal === 0
          ? "Add a ritual"
          : "Keep the chain",
      href: "/habits",
      meter: habitsTotal > 0 ? habitPct : undefined,
      tone: habitClear ? "sealed" : "default",
    },
    {
      id: "focus",
      label: "Focus",
      value: focusMinutes > 0 ? formatFocusMinutes(focusMinutes) : "0m",
      hint:
        focusGoalMinutes > 0
          ? `${focusPct}% of goal`
          : "Open studio",
      href: "/focus",
      meter: focusGoalMinutes > 0 ? focusPct : undefined,
      tone: focusSealed ? "sealed" : focusMinutes > 0 ? "live" : "default",
    },
    {
      id: "streak",
      label: "Streak",
      value: streak > 0 ? `${streak}d` : "—",
      hint: streak > 0 ? "Activity chain" : "Start today",
      href: "/analytics",
      meter: streak > 0 ? Math.min(100, Math.round((streak / 21) * 100)) : undefined,
      tone: streak >= 7 ? "live" : "default",
    },
  ];

  return (
    <SectionReveal delay={REVEAL_DELAY[1]}>
      <StaggerList className="dash-kpis" delay={0.02}>
        {items.map((item) => (
          <StaggerItem key={item.id} className="h-full">
            <Link
              href={item.href}
              className={cn("dash-kpi", item.tone && `dash-kpi-${item.tone}`)}
            >
              <span className="dash-kpi-top">
                <span className="dash-kpi-label">
                  {item.id === "streak" ? (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-3 opacity-70" aria-hidden />
                      {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
                <span className="dash-kpi-value">{item.value}</span>
              </span>
              <span className="dash-kpi-foot">
                {typeof item.meter === "number" ? (
                  <span
                    className="dash-kpi-meter"
                    aria-hidden
                  >
                    <span
                      className="dash-kpi-meter-fill"
                      style={{ width: `${item.meter}%` }}
                    />
                  </span>
                ) : (
                  <span className="dash-kpi-meter dash-kpi-meter-ghost" aria-hidden />
                )}
                <span className="dash-kpi-hint">{item.hint}</span>
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>
    </SectionReveal>
  );
}
