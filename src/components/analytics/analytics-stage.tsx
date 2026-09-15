import type { ReactNode } from "react";

type AnalyticsStageProps = {
  children: ReactNode;
};

/** Pattern chamber — atmosphere matching Habits / Search / Focus. */
export function AnalyticsStage({ children }: AnalyticsStageProps) {
  return (
    <div className="analytics-stage">
      <div className="analytics-stage-wash" aria-hidden="true" />
      <div className="analytics-stage-glow" aria-hidden="true" />
      <div className="analytics-stage-glow-soft" aria-hidden="true" />
      <div className="analytics-stage-content">{children}</div>
    </div>
  );
}
