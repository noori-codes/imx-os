import type { ReactNode } from "react";

type NotesStageProps = {
  children: ReactNode;
};

/** Light writing-studio shell — matches dashboard/calendar rhythm. */
export function NotesStage({ children }: NotesStageProps) {
  return (
    <div className="notes-stage">
      <div className="notes-stage-wash" aria-hidden="true" />
      <div className="notes-stage-content">{children}</div>
    </div>
  );
}
