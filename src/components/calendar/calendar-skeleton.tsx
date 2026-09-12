import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function CalendarSkeletonBody() {
  return (
    <div className="cal-stage-content flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Bone className="h-2.5 w-20" />
          <div className="flex items-center gap-2">
            <Bone className="h-8 w-44 sm:h-9 sm:w-56" />
            <Bone className="size-9 rounded-xl" />
            <Bone className="size-9 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-16 rounded-xl" />
          <Bone className="h-9 w-36 rounded-xl" />
        </div>
      </header>

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80">
          <div className="grid grid-cols-7 border-b border-border/40">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex justify-center py-2.5">
                <Bone className="h-2.5 w-8" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-20 flex-col border-r border-b border-border/35 p-1.5 last:border-r-0"
              >
                <Bone className="size-7 rounded-full" />
                <div className="mt-auto flex justify-center gap-1 pb-1">
                  {i % 3 === 0 ? <Bone className="size-1.5 rounded-full" /> : null}
                  {i % 5 === 0 ? <Bone className="size-1.5 rounded-full" /> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="min-h-112 overflow-hidden rounded-2xl border border-border/50 bg-card/80">
          <div className="space-y-2 border-b border-border/40 px-5 py-4">
            <Bone className="h-2.5 w-20" />
            <Bone className="h-5 w-40" />
            <Bone className="h-2.5 w-28 opacity-55" />
          </div>
          <div className="space-y-4 px-5 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-14 w-full rounded-xl" />
            ))}
            <Bone className="mt-6 h-9 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div
      className="imx-skeleton calendar-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading calendar"
    >
      <AppPageFrame className="max-w-6xl gap-8 md:py-8">
        <CalendarSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
