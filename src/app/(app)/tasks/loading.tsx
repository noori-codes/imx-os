import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function TasksSkeletonBody() {
  return (
    <div className="tasks-stage-content flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-8 w-28 sm:h-9" />
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
        <Bone className="mt-3 h-7 w-64 max-w-full" />
        <Bone className="mt-2 h-3.5 w-48 max-w-full opacity-55" />
        <Bone className="mt-5 h-11 w-36 rounded-full" />
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
    </div>
  );
}

export default function TasksLoading() {
  return (
    <>
      <Header title="Tasks" />
      <div
        className="imx-skeleton tasks-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading tasks"
      >
        <AppPageFrame className="max-w-5xl gap-8 md:py-8">
          <TasksSkeletonBody />
        </AppPageFrame>
      </div>
    </>
  );
}
