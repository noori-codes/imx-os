import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function GoalsSkeletonBody() {
  return (
    <div className="goals-stage-content flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-8 w-32 sm:h-9" />
        <Bone className="h-3.5 w-72 max-w-full opacity-55" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <Bone className="h-2.5 w-16" />
            <Bone className="mt-2 h-7 w-12" />
            <Bone className="mt-2 h-2.5 w-20 opacity-55" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5 sm:px-7 sm:py-6">
        <Bone className="h-2.5 w-24" />
        <Bone className="mt-3 h-7 w-56 max-w-full" />
        <Bone className="mt-2 h-3.5 w-80 max-w-full opacity-55" />
        <div className="mt-5 flex items-center justify-between">
          <Bone className="h-3 w-40" />
          <Bone className="size-20 rounded-full sm:size-28" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
        <Bone className="h-2.5 w-16" />
        <Bone className="mt-3 h-10 w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 p-4"
          >
            <div className="flex gap-3">
              <Bone className="size-14 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-full opacity-55" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div
      className="imx-skeleton goals-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading goals"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <GoalsSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
