import { DashboardAtmosphere } from "@/components/dashboard/dashboard-atmosphere";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function PanelHeader({ withRing = false }: { withRing?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/25 px-5 py-3.5">
      <div className="space-y-2">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-3 w-20" />
        <Bone className="h-2.5 w-24 opacity-55" />
      </div>
      {withRing ? <Bone className="size-12 rounded-full" /> : null}
    </div>
  );
}

function DashboardSkeletonBody() {
  return (
    <>
      <section className="dash-desk-top">
        <header className="dash-masthead">
          <div className="dash-masthead-top">
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3 w-40" />
              <Bone className="h-9 w-64 max-w-full sm:w-80" />
              <Bone className="h-3.5 w-72 max-w-full opacity-55" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-10 w-24 rounded-xl" />
              <Bone className="h-10 w-22 rounded-xl" />
            </div>
          </div>
          <div className="dash-metric-rail">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dash-metric">
                <Bone className="h-2.5 w-12" />
                <Bone className="mt-2 h-5 w-10" />
              </div>
            ))}
          </div>
        </header>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-8 w-16 rounded-md" />
          ))}
        </div>
      </section>

      <div className="dash-home">
        <div className="dash-home-main">
          <section className="dash-panel flex h-full min-h-64 flex-col">
            <PanelHeader />
            <div className="space-y-3 px-5 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </section>
        </div>
        <div className="dash-home-side">
          <section className="dash-panel flex flex-col">
            <PanelHeader withRing />
            <div className="flex flex-wrap gap-3 px-5 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="size-10 rounded-full" />
              ))}
            </div>
          </section>
          <section className="dash-panel">
            <div className="flex items-center gap-4 px-5 py-4">
              <Bone className="size-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className="h-2.5 w-12" />
                <Bone className="h-3.5 w-28" />
                <Bone className="h-2.5 w-24 opacity-55" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="dash-home-secondary">
        <section className="dash-panel">
          <PanelHeader />
          <div className="flex h-24 items-end gap-2 px-5 py-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Bone key={i} className="h-1/2 w-full rounded-md odd:h-3/4 even:h-2/5" />
            ))}
          </div>
        </section>
        <section className="dash-panel">
          <div className="flex h-full flex-col justify-between gap-4 px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-2.5 w-14" />
              <Bone className="h-4 w-40 max-w-full" />
              <Bone className="h-2.5 w-24 opacity-55" />
            </div>
            <div className="flex items-center justify-between">
              <Bone className="size-12 rounded-full" />
              <Bone className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <DashboardAtmosphere className="imx-skeleton">
      <DashboardSkeletonBody />
    </DashboardAtmosphere>
  );
}
