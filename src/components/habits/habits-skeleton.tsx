import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function HabitsSkeletonBody() {
  return (
    <div className="habits-stage-content flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <Bone className="h-2.5 w-24" />
        <Bone className="h-8 w-36 sm:h-9" />
        <Bone className="h-3.5 w-64 max-w-full opacity-55" />
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
        <Bone className="h-2.5 w-28" />
        <Bone className="mt-3 h-7 w-48 max-w-full" />
        <Bone className="mt-2 h-3.5 w-72 max-w-full opacity-55" />
        <div className="mt-5 flex justify-end">
          <Bone className="size-28 rounded-full" />
        </div>
      </div>

      <div className="flex gap-2">
        <Bone className="h-8 w-20 rounded-lg" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>

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
                <Bone className="h-2 w-full" />
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
        <HabitsSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
