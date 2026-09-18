import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function PanelHeader({ withRing = false }: { withRing?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
      <div className="space-y-2">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-3 w-20" />
        <Bone className="h-2.5 w-24 opacity-55" />
      </div>
      <div className="flex items-center gap-3">
        {withRing ? <Bone className="size-12 rounded-full" /> : null}
        <Bone className="h-2.5 w-12" />
      </div>
    </div>
  );
}

function DashboardSkeletonBody() {
  return (
    <div className="dash-page-content flex flex-1 flex-col gap-6">
      <section className="dash-stage dash-stage-hero relative overflow-hidden px-6 py-9 sm:px-9 sm:py-11">
        <div className="relative z-[2] flex min-h-[min(44vh,23rem)] flex-col justify-between gap-12 sm:min-h-[25rem]">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3.5 text-center sm:text-left">
              <Bone className="mx-auto h-2.5 w-36 sm:mx-0" />
              <Bone className="mx-auto h-9 w-60 max-w-full sm:mx-0 sm:h-10 sm:w-80" />
              <Bone className="mx-auto h-3.5 w-52 max-w-full opacity-55 sm:mx-0" />
            </div>
            <Bone className="mx-auto h-10 w-28 rounded-xl sm:mx-0" />
          </div>
          <div className="flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2.5 text-center sm:text-left">
              <Bone className="mx-auto h-2.5 w-20 sm:mx-0" />
              <Bone className="mx-auto h-16 w-28 sm:mx-0 sm:h-[4.5rem]" />
            </div>
            <div className="grid grid-cols-3 gap-5 sm:min-w-[17.5rem] sm:gap-7">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 text-center sm:text-left">
                  <Bone className="mx-auto h-2.5 w-12 sm:mx-0" />
                  <Bone className="mx-auto h-6 w-14 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="dash-bento">
        <div className="dash-bento-today min-h-88 lg:min-h-112">
          <section className="dash-panel flex h-full flex-col">
            <PanelHeader />
            <div className="space-y-1 px-3 py-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <Bone className="size-5 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bone className="h-3 w-[70%]" />
                    <Bone className="h-2 w-16 opacity-50" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dash-bento-side flex flex-col gap-3">
          <section className="dash-panel min-h-44">
            <PanelHeader withRing />
            <div className="flex flex-wrap gap-3 px-5 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex w-17 flex-col items-center gap-1.5">
                  <Bone className="size-10 rounded-full" />
                  <Bone className="h-2.5 w-10" />
                </div>
              ))}
            </div>
          </section>
          <section className="dash-panel min-h-48">
            <PanelHeader />
            <div className="flex items-center gap-4 px-5 py-4">
              <Bone className="size-16 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-3 w-[70%]" />
                <Bone className="h-2.5 w-24 opacity-55" />
              </div>
            </div>
          </section>
        </div>

        <div className="dash-bento-week">
          <section className="dash-panel">
            <PanelHeader />
            <div className="grid h-36 grid-cols-7 items-end gap-2 px-5 py-5 sm:gap-3">
              {[
                "h-8",
                "h-14",
                "h-10",
                "h-20",
                "h-12",
                "h-16",
                "h-9",
              ].map((height, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Bone className="h-2 w-3 opacity-40" />
                  <Bone
                    className={cn("w-full max-w-9 rounded-md", height)}
                  />
                  <Bone className="h-2.5 w-5 opacity-55" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="dash-insight-strip border-t border-border/30 pt-6">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-3 w-56 max-w-full" />
          </div>
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
      <AppPageFrame className="max-w-6xl gap-8 md:py-8">
        <DashboardSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
