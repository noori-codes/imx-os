import { AppPageFrame } from "@/components/shared/app-page-frame";
import { TasksStage } from "@/components/tasks/tasks-stage";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function TasksSkeletonBody() {
  return (
    <>
      <div className="tasks-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
            <Bone className="mx-auto h-8 w-48 max-w-full sm:mx-0" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Bone className="mx-auto h-2 w-10 sm:mx-0" />
                  <Bone className="mx-auto h-5 w-8 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="mx-auto size-32 shrink-0 rounded-full sm:mx-0" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
        <Bone className="h-9 w-full max-w-xs rounded-xl" />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
        <Bone className="h-2.5 w-16" />
        <Bone className="mt-3 h-11 w-full" />
        <div className="mt-3 flex gap-1.5">
          <Bone className="h-7 w-14 rounded-lg" />
          <Bone className="h-7 w-16 rounded-lg" />
          <Bone className="h-7 w-16 rounded-lg" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80">
        <div className="flex justify-between border-b border-border/40 px-4 py-3">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-2.5 w-4" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border/30 px-4 py-3 last:border-b-0"
          >
            <Bone className="size-5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bone className="h-3 w-[65%]" />
              <Bone className="h-2 w-24 opacity-50" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function TasksSkeleton() {
  return (
    <div
      className="imx-skeleton tasks-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading tasks"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <TasksStage>
          <TasksSkeletonBody />
        </TasksStage>
      </AppPageFrame>
    </div>
  );
}
