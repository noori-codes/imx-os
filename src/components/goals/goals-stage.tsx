import type { ReactNode } from "react";

type GoalsStageProps = {
  children: ReactNode;
};

/** North-star board shell — atmosphere matching Tasks / Notes / Review. */
export function GoalsStage({ children }: GoalsStageProps) {
  return (
    <div className="goals-stage">
      <div className="goals-stage-wash" aria-hidden="true" />
      <div className="goals-stage-glow" aria-hidden="true" />
      <div className="goals-stage-glow-soft" aria-hidden="true" />
      <div className="goals-stage-content">{children}</div>
    </div>
  );
}
