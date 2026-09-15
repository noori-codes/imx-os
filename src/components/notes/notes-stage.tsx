import type { ReactNode } from "react";

type NotesStageProps = {
  children: ReactNode;
};

/** Writing-studio shell — atmosphere matching Tasks / Habits / Calendar. */
export function NotesStage({ children }: NotesStageProps) {
  return (
    <div className="notes-stage">
      <div className="notes-stage-wash" aria-hidden="true" />
      <div className="notes-stage-glow" aria-hidden="true" />
      <div className="notes-stage-glow-soft" aria-hidden="true" />
      <div className="notes-stage-content">{children}</div>
    </div>
  );
}
