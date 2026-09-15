import type { ReactNode } from "react";

type SearchStageProps = {
  children: ReactNode;
};

/** Search studio shell — layered atmosphere matching Focus / Goals. */
export function SearchStage({ children }: SearchStageProps) {
  return (
    <div className="search-stage">
      <div className="search-stage-wash" aria-hidden="true" />
      <div className="search-stage-glow" aria-hidden="true" />
      <div className="search-stage-glow-soft" aria-hidden="true" />
      <div className="search-stage-content">{children}</div>
    </div>
  );
}
