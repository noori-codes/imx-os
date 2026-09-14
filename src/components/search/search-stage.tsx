import type { ReactNode } from "react";

type SearchStageProps = {
  children: ReactNode;
};

/** Search studio shell — matches Goals/Tasks rhythm. */
export function SearchStage({ children }: SearchStageProps) {
  return (
    <div className="search-stage">
      <div className="search-stage-wash" aria-hidden="true" />
      <div className="search-stage-content">{children}</div>
    </div>
  );
}
