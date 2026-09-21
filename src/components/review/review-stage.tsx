import type { ReactNode } from "react";

/** Evening-ritual shell — atmosphere matching Notes / Books / Tasks. */
export function ReviewStage({
  children,
  mood,
}: {
  children: ReactNode;
  mood?: number | null;
}) {
  return (
    <div
      className="review-stage"
      data-mood={mood && mood >= 1 && mood <= 5 ? String(mood) : undefined}
    >
      <div className="review-stage-wash" aria-hidden="true" />
      <div className="review-stage-glow" aria-hidden="true" />
      <div className="review-stage-glow-soft" aria-hidden="true" />
      <div className="review-stage-content">{children}</div>
    </div>
  );
}
