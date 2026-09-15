import { HabitsStage } from "@/components/habits/habits-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function HabitsSkeletonBody() {
  return (
    <div className="flex flex-col gap-6">
      <div className="habits-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-24 sm:mx-0" />
            <Bone className="mx-auto h-8 w-48 max-w-full sm:mx-0 sm:h-9" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Bone className="h-2.5 w-10" />
                  <Bone className="h-5 w-12" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="mx-auto size-32 rounded-full sm:mx-0" />
        </div>
      </div>

      <Bone className="h-9 w-full max-w-sm rounded-full" />

      <div className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
        <Bone className="h-2.5 w-20" />
        <Bone className="mt-3 h-10 w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 p-4"
          >
            <div className="flex gap-3">
              <Bone className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-24" />
                <div className="flex gap-1.5 pt-1">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Bone key={j} className="h-2.5 flex-1 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HabitsSkeleton() {
  return (
    <div
      className="imx-skeleton habits-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading habits"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <HabitsStage>
          <HabitsSkeletonBody />
        </HabitsStage>
      </AppPageFrame>
    </div>
  );
}
