import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function PanelHeader() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
      <div className="space-y-2">
        <Bone className="h-3 w-16" />
        <Bone className="h-2.5 w-24 opacity-55" />
      </div>
      <Bone className="h-2.5 w-12" />
    </div>
  );
}

function DashboardSkeletonBody() {
  return (
    <div className="dash-page-content flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Bone className="h-2.5 w-28" />
          <Bone className="h-8 w-56 max-w-full sm:h-9 sm:w-72" />
          <Bone className="h-3.5 w-48 max-w-full opacity-55" />
        </div>
        <Bone className="h-10 w-24 rounded-xl" />
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5"
          >
            <Bone className="h-2.5 w-16" />
            <Bone className="mt-3 h-8 w-14 sm:h-9" />
            <Bone className="mt-2 h-2.5 w-20 opacity-55" />
          </div>
        ))}
      </div>

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

        <div className="dash-bento-side flex flex-col gap-4">
          <section className="dash-panel min-h-44">
            <PanelHeader />
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
            <div className="space-y-4 px-5 py-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <Bone className="h-3 w-[55%]" />
                    <Bone className="h-3 w-8" />
                  </div>
                  <Bone className="h-1.5 w-full rounded-full" />
                </div>
              ))}
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

      <div className="dash-insight-strip rounded-2xl border px-5 py-4 sm:px-6">
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
