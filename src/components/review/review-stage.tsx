import type { ReactNode } from "react";

type ReviewStageProps = {
  children: ReactNode;
};

/** Evening ritual shell — matches Notes/Books/Calendar rhythm. */
export function ReviewStage({ children }: ReviewStageProps) {
  return (
    <div className="review-stage">
      <div className="review-stage-wash" aria-hidden="true" />
      <div className="review-stage-content">{children}</div>
    </div>
  );
}
