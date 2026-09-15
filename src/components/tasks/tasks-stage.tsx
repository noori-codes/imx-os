import type { ReactNode } from "react";

type TasksStageProps = {
  children: ReactNode;
};

/** Command deck shell — atmosphere matching Habits / Focus / Search. */
export function TasksStage({ children }: TasksStageProps) {
  return (
    <div className="tasks-stage">
      <div className="tasks-stage-wash" aria-hidden="true" />
      <div className="tasks-stage-glow" aria-hidden="true" />
      <div className="tasks-stage-glow-soft" aria-hidden="true" />
      <div className="tasks-stage-content">{children}</div>
    </div>
  );
}
