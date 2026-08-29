import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function QuadHeader() {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Bone className="h-2.5 w-14" />
      <Bone className="h-2.5 w-6" />
    </div>
  );
}

function QuadSignal() {
  return (
    <div className="mt-4 space-y-2">
      <Bone className="h-8 w-14" />
      <Bone className="h-3 w-20 opacity-55" />
    </div>
  );
}

function DashboardSkeletonBody() {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <section className="dash-stage px-5 py-6 sm:px-7 sm:py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="mx-auto space-y-2.5 sm:mx-0">
              <Bone className="mx-auto h-8 w-56 max-w-full sm:mx-0 sm:h-9 sm:w-64" />
              <Bone className="mx-auto h-3.5 w-40 opacity-55 sm:mx-0" />
            </div>
            <Bone className="mx-auto h-10 w-28 rounded-full sm:mx-0" />
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
            <div className="mx-auto space-y-2 sm:mx-0">
              <Bone className="mx-auto h-2.5 w-20 sm:mx-0" />
              <Bone className="mx-auto h-[4.5rem] w-32 sm:mx-0 sm:w-36" />
            </div>
            <div className="grid grid-cols-2 gap-6 sm:min-w-[11rem] sm:gap-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2 text-center sm:text-left">
                  <Bone className="mx-auto h-2.5 w-10 sm:mx-0" />
                  <Bone className="mx-auto h-6 w-12 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="dash-quad-shell">
        <div className="dash-quad grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1fr_1fr]">
          <div className="dash-quad-cell" data-quad="tasks">
            <section className="min-w-0">
              <QuadHeader />
              <QuadSignal />
              <div className="mt-5 space-y-1 border-t border-border/30 pt-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2">
                    <Bone className="size-4 shrink-0 rounded-full" />
                    <Bone className="h-2.5 w-[68%]" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="dash-quad-cell" data-quad="habits">
            <section className="min-w-0">
              <QuadHeader />
              <QuadSignal />
              <div className="mt-5 flex flex-wrap gap-3 border-t border-border/30 pt-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex w-16 flex-col items-center gap-1.5"
                  >
                    <Bone className="size-11 rounded-full sm:size-12" />
                    <Bone className="h-2.5 w-10" />
                    <Bone className="h-2 w-5 opacity-55" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="dash-quad-cell" data-quad="week">
            <section className="min-w-0">
              <QuadHeader />
              <QuadSignal />
              <div className="mt-auto border-t border-border/30 pt-5">
                <div className="dash-heat-stage">
                  <div className="grid grid-cols-7 items-end gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-2"
                      >
                        <Bone className="h-2.5 w-3 opacity-40" />
                        <div className="dash-heat-jewel-wrap">
                          <Bone
                            className={
                              i % 3 === 0
                                ? "size-2.5 rounded-full"
                                : i % 3 === 1
                                  ? "size-3.5 rounded-full"
                                  : "size-4 rounded-full"
                            }
                          />
                        </div>
                        <Bone className="h-2.5 w-5 opacity-55" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="dash-quad-cell" data-quad="goals">
            <section className="min-w-0">
              <QuadHeader />
              <QuadSignal />
              <div className="mt-5 border-t border-border/30 pt-4">
                <div className="flex items-center gap-3.5">
                  <Bone className="size-16 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bone className="h-2.5 w-[72%]" />
                    <Bone className="h-2 w-16 opacity-55" />
                  </div>
                </div>
                <div className="mt-3 space-y-2.5 border-t border-border/20 pt-3">
                  <div className="flex items-center gap-3">
                    <Bone className="size-[34px] shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Bone className="h-2.5 w-[58%]" />
                      <Bone className="h-2 w-14 opacity-55" />
                    </div>
                    <Bone className="h-2.5 w-7" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="dash-insight-strip rounded-2xl border border-border/40 px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Bone className="h-3 w-56 max-w-full" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="imx-skeleton dashboard-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <AppPageFrame className="max-w-5xl gap-10 md:py-8">
        <DashboardSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
