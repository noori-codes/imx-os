import type { ReactNode } from "react";

type HabitsStageProps = {
  children: ReactNode;
};

/** Daily pulse shell — layered atmosphere matching Focus / Search. */
export function HabitsStage({ children }: HabitsStageProps) {
  return (
    <div className="habits-stage">
      <div className="habits-stage-wash" aria-hidden="true" />
      <div className="habits-stage-glow" aria-hidden="true" />
      <div className="habits-stage-glow-soft" aria-hidden="true" />
      <div className="habits-stage-content">{children}</div>
    </div>
  );
}
