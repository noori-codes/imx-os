import type { ReactNode } from "react";

type CalendarStageProps = {
  children: ReactNode;
};

/** Light command-center shell — matches dashboard rhythm. */
export function CalendarStage({ children }: CalendarStageProps) {
  return (
    <div className="cal-stage">
      <div className="cal-stage-wash" aria-hidden="true" />
      <div className="cal-stage-content">{children}</div>
    </div>
  );
}
