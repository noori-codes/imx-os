import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import {
  goalMotion,
  goalMotionLabel,
  goalProgressPercent,
} from "@/lib/goal-status";
import { cn } from "@/lib/utils";
import type { GoalWithCounts } from "@/types/goal";

export type GoalsPulseStats = {
  goalCount: number;
  projectCount: number;
  completedTasks: number;
  totalTasks: number;
  momentum: number | null;
  activeCount: number;
  spotlight: GoalWithCounts | null;
};

type GoalsPulseProps = {
  stats: GoalsPulseStats;
};

function pulseCopy(stats: GoalsPulseStats) {
  if (stats.goalCount === 0) {
    return {
      title: "No north star yet",
      body: "Declare an outcome below. Break it into projects, then tasks.",
      sealed: false,
    };
  }

  if (stats.spotlight) {
    const progress = goalProgressPercent(stats.spotlight);
    const motion = goalMotion(stats.spotlight);
    if (motion === "complete") {
      return {
        title: "North star cleared",
        body: `“${stats.spotlight.title}” is done${stats.activeCount > 0 ? ` · ${stats.activeCount} still in flight` : ""}.`,
        sealed: true,
      };
    }
    return {
      title: motion === "closing_in" ? "Closing in" : "Closest finish",
      body: `“${stats.spotlight.title}”${stats.spotlight.task_count > 0 ? ` · ${progress}%` : " · awaiting tasks"}${stats.activeCount > 1 ? ` · ${stats.activeCount} in flight` : ""}.`,
      sealed: false,
    };
  }

  return {
    title: stats.activeCount > 0 ? `${stats.activeCount} in flight` : "Shelf of outcomes",
    body:
      stats.momentum != null
        ? `${stats.momentum}% momentum across ${stats.goalCount} goal${stats.goalCount === 1 ? "" : "s"}.`
        : "Outcomes broken into projects and tasks.",
    sealed: false,
  };
}

export function GoalsPulse({ stats }: GoalsPulseProps) {
  const copy = pulseCopy(stats);
  const spotlight = stats.spotlight;
  const spotlightProgress = spotlight ? goalProgressPercent(spotlight) : 0;
  const spotlightHasTasks = Boolean(spotlight && spotlight.task_count > 0);
  const ringValue =
    spotlightHasTasks
      ? spotlightProgress
      : stats.momentum ?? 0;

  return (
    <section
      className={cn(
        "goals-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8",
        copy.sealed && "goals-pulse-sealed",
      )}
    >
      <div className="goals-pulse-vignette" aria-hidden />
      <div className="goals-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              North star board
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Goals
            </h2>
          </div>
          <div className="flex justify-center sm:justify-end">
            <a
              href="#goals-composer"
              className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Declare a goal
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
              {copy.body}
            </p>

            <div className="goals-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Goals
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {stats.goalCount > 0 ? stats.goalCount : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Projects
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {stats.projectCount > 0 ? stats.projectCount : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Tasks
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {stats.totalTasks > 0
                    ? `${stats.completedTasks}/${stats.totalTasks}`
                    : "—"}
                </p>
              </div>
            </div>

            {spotlight ? (
              <div className="mt-5 flex flex-col items-center gap-2 sm:items-start">
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {goalMotionLabel(goalMotion(spotlight))}
                  </span>
                  {" · "}
                  {spotlight.project_count} project
                  {spotlight.project_count === 1 ? "" : "s"}
                </p>
                <div className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <p className="truncate text-sm font-medium text-foreground">
                    {spotlight.title}
                  </p>
                  <Link
                    href={`/goals/${spotlight.id}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Open
                    <ArrowUpRight className="size-3 opacity-70" />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <ProgressRing
            value={ringValue}
            size={128}
            stroke={7}
            sealed={copy.sealed || ringValue >= 100}
            featured
            className="mx-auto sm:mx-0"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {spotlightHasTasks
                  ? `${spotlightProgress}%`
                  : stats.momentum != null
                    ? `${stats.momentum}%`
                    : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {spotlightHasTasks
                  ? "done"
                  : stats.momentum != null
                    ? "momentum"
                    : "seed"}
              </p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
