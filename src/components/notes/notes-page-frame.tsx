import type { ReactNode } from "react";

import { AppPageFrame } from "@/components/shared/app-page-frame";

/** @deprecated Prefer AppPageFrame — kept as alias during migration. */
export function NotesPageFrame({ children }: { children: ReactNode }) {
  return <AppPageFrame>{children}</AppPageFrame>;
}
