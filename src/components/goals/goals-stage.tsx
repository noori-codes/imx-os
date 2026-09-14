import type { ReactNode } from "react";

type GoalsStageProps = {
  children: ReactNode;
};

/** North-star board shell — matches Notes/Books/Review rhythm. */
export function GoalsStage({ children }: GoalsStageProps) {
  return (
    <div className="goals-stage">
      <div className="goals-stage-wash" aria-hidden="true" />
      <div className="goals-stage-content">{children}</div>
    </div>
  );
}
