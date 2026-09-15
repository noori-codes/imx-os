import { Header } from "@/components/layout/header";
import { GoalsStage } from "@/components/goals/goals-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

export function ProjectDetailSkeleton() {
  return (
    <>
      <Header title="Project" />
      <div
        className="imx-skeleton goals-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading project"
      >
        <AppPageFrame className="max-w-5xl gap-8 md:py-8">
          <GoalsStage>
            <Bone className="h-3 w-56" />
            <div className="goals-pulse relative overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <Bone className="h-2.5 w-20" />
                  <Bone className="h-8 w-48 max-w-full" />
                  <Bone className="h-3 w-40 opacity-55" />
                </div>
                <Bone className="mx-auto size-28 shrink-0 rounded-full sm:mx-0" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
              <Bone className="h-2.5 w-16" />
              <Bone className="mt-3 h-11 w-full" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/30 px-4 py-3 last:border-b-0"
                >
                  <Bone className="size-5 shrink-0 rounded-full" />
                  <Bone className="h-3 w-[60%]" />
                </div>
              ))}
            </div>
          </GoalsStage>
        </AppPageFrame>
      </div>
    </>
  );
}
