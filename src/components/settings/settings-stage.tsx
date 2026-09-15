import type { ReactNode } from "react";

type SettingsStageProps = {
  children: ReactNode;
};

/** Control-room shell — atmosphere matching Goals / Notes / Tasks. */
export function SettingsStage({ children }: SettingsStageProps) {
  return (
    <div className="settings-stage">
      <div className="settings-stage-wash" aria-hidden="true" />
      <div className="settings-stage-glow" aria-hidden="true" />
      <div className="settings-stage-glow-soft" aria-hidden="true" />
      <div className="settings-stage-content">{children}</div>
    </div>
  );
}
