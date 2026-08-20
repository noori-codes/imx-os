import type { ReactNode } from "react";

export function NotesPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
      {children}
    </div>
  );
}
