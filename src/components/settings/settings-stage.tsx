import type { ReactNode } from "react";

type SettingsStageProps = {
  children: ReactNode;
};

/** Control room shell — matches Goals/Habits/Tasks rhythm. */
export function SettingsStage({ children }: SettingsStageProps) {
  return (
    <div className="settings-stage">
      <div className="settings-stage-wash" aria-hidden="true" />
      <div className="settings-stage-content">{children}</div>
    </div>
  );
}
