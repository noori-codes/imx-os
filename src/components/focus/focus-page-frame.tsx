import type { ReactNode } from "react";

import { AppPageFrame } from "@/components/shared/app-page-frame";

/** @deprecated Prefer AppPageFrame — kept as alias during migration. */
export function FocusPageFrame({ children }: { children: ReactNode }) {
  return <AppPageFrame>{children}</AppPageFrame>;
}

export function FocusWorkspace({
  stage,
  rail,
}: {
  stage: ReactNode;
  rail: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6">
      {stage}
      <div className="flex min-w-0 flex-col gap-5">{rail}</div>
    </div>
  );
}
