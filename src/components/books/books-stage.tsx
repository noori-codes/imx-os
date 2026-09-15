import type { ReactNode } from "react";

type BooksStageProps = {
  children: ReactNode;
};

/** Reading-shelf shell — atmosphere matching Notes / Tasks / Habits. */
export function BooksStage({ children }: BooksStageProps) {
  return (
    <div className="books-stage">
      <div className="books-stage-wash" aria-hidden="true" />
      <div className="books-stage-glow" aria-hidden="true" />
      <div className="books-stage-glow-soft" aria-hidden="true" />
      <div className="books-stage-content">{children}</div>
    </div>
  );
}
