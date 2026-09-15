import type { ReactNode } from "react";

type CalendarStageProps = {
  children: ReactNode;
};

/** Command-center shell — atmosphere matching Tasks / Habits / Search. */
export function CalendarStage({ children }: CalendarStageProps) {
  return (
    <div className="cal-stage">
      <div className="cal-stage-wash" aria-hidden="true" />
      <div className="cal-stage-glow" aria-hidden="true" />
      <div className="cal-stage-glow-soft" aria-hidden="true" />
      <div className="cal-stage-content">{children}</div>
    </div>
  );
}
