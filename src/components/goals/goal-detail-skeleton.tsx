import { Header } from "@/components/layout/header";
import { GoalsStage } from "@/components/goals/goals-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

export function GoalDetailSkeleton() {
  return (
    <>
      <Header title="Goal" />
      <div
        className="imx-skeleton goals-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading goal"
      >
        <AppPageFrame className="max-w-5xl gap-8 md:py-8">
          <GoalsStage>
            <Bone className="h-3 w-40" />
            <div className="goals-pulse relative overflow-hidden rounded-[1.35rem] imx-surface px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <Bone className="h-2.5 w-16" />
                  <Bone className="h-8 w-56 max-w-full" />
                  <Bone className="h-3.5 w-72 max-w-full opacity-55" />
                  <Bone className="h-3 w-40 opacity-55" />
                </div>
                <Bone className="mx-auto size-28 shrink-0 rounded-full sm:mx-0" />
              </div>
            </div>
            <div className="rounded-2xl imx-surface p-4 sm:p-5">
              <Bone className="h-2.5 w-16" />
              <Bone className="mt-3 h-10 w-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl imx-surface p-4"
                >
                  <Bone className="h-4 w-40" />
                  <Bone className="mt-2 h-3 w-full opacity-55" />
                  <Bone className="mt-3 h-3 w-24" />
                </div>
              ))}
            </div>
          </GoalsStage>
        </AppPageFrame>
      </div>
    </>
  );
}
