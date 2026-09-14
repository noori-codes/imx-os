import type { GoalWithCounts } from "@/types/goal";

export type GoalMotion =
  | "quiet"
  | "in_motion"
  | "closing_in"
  | "complete";

export function goalProgressPercent(goal: GoalWithCounts): number {
  if (goal.task_count <= 0) return 0;
  return Math.round((goal.completed_task_count / goal.task_count) * 100);
}

export function goalMotion(goal: GoalWithCounts): GoalMotion {
  if (goal.task_count <= 0) return "quiet";
  const progress = goalProgressPercent(goal);
  if (progress >= 100) return "complete";
  if (progress >= 70) return "closing_in";
  return "in_motion";
}

export function goalMotionLabel(motion: GoalMotion): string {
  switch (motion) {
    case "quiet":
      return "Quiet";
    case "in_motion":
      return "In motion";
    case "closing_in":
      return "Closing in";
    case "complete":
      return "Complete";
  }
}

/** Spotlight: closest unfinished goal, else most active, else newest. */
export function pickSpotlightGoal(
  goals: GoalWithCounts[],
): GoalWithCounts | null {
  if (goals.length === 0) return null;

  const unfinished = goals.filter(
    (goal) => goal.task_count > 0 && goalProgressPercent(goal) < 100,
  );
  if (unfinished.length > 0) {
    return [...unfinished].sort((a, b) => {
      const pa = goalProgressPercent(a);
      const pb = goalProgressPercent(b);
      if (pb !== pa) return pb - pa;
      return b.task_count - a.task_count;
    })[0]!;
  }

  const withTasks = goals.filter((goal) => goal.task_count > 0);
  if (withTasks.length > 0) {
    return [...withTasks].sort(
      (a, b) => b.completed_task_count - a.completed_task_count,
    )[0]!;
  }

  return goals[0]!;
}
