import type { ReactNode } from "react";

type BooksStageProps = {
  children: ReactNode;
};

export function BooksStage({ children }: BooksStageProps) {
  return (
    <div className="books-stage">
      <div className="books-stage-wash" aria-hidden="true" />
      <div className="books-stage-content">{children}</div>
    </div>
  );
}
