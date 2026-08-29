export type DashboardPhase = "morning" | "afternoon" | "evening" | "night";

export function dashboardPhaseFromHour(hour: number): DashboardPhase {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}
