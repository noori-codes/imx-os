import type { ReactNode } from "react";

export function FocusPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
      {children}
    </div>
  );
}

export function FocusWorkspace({
  stage,
  rail,
}: {
  stage: ReactNode;
  rail: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
      {stage}
      <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-20">
        {rail}
      </div>
    </div>
  );
}
