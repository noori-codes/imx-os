import { DashboardAtmosphere } from "@/components/dashboard/dashboard-atmosphere";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function PanelHeader({ withRing = false }: { withRing?: boolean }) {
  return (
    <>
      <div className="flex items-end justify-between gap-3 px-5 pb-3 pt-5">
        <div className="space-y-2">
          <Bone className="h-2.5 w-14" />
          <Bone className="h-5 w-28" />
          <Bone className="h-3 w-32 opacity-55" />
        </div>
        {withRing ? <Bone className="size-11 rounded-full" /> : <Bone className="h-3 w-14" />}
      </div>
      <div className="mx-5 border-t border-border/30" aria-hidden />
    </>
  );
}

function DashboardSkeletonBody() {
  return (
    <>
      <section className="dash-desk-top">
        <header className="dash-masthead">
          <div className="dash-masthead-top">
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3 w-36" />
              <Bone className="h-11 w-80 max-w-full" />
              <Bone className="h-3.5 w-56 max-w-full opacity-55" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-10 w-28 rounded-xl" />
              <Bone className="h-10 w-22 rounded-xl" />
            </div>
          </div>
        </header>

        <div className="dash-kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dash-kpi">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-7 w-14" />
              <Bone className="h-3 w-20 opacity-55" />
            </div>
          ))}
        </div>
      </section>

      <div className="dash-bento">
        <div className="dash-bento-today">
          <section className="dash-panel dash-panel-primary flex h-full min-h-64 flex-col">
            <PanelHeader />
            <div className="space-y-3 px-5 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Bone key={i} className="h-11 w-full rounded-xl" />
              ))}
            </div>
          </section>
        </div>
        <div className="dash-bento-habits">
          <section className="dash-panel flex h-full flex-col">
            <PanelHeader withRing />
            <div className="flex flex-wrap gap-3 px-5 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="size-10 rounded-full" />
              ))}
            </div>
          </section>
        </div>
        <div className="dash-bento-focus">
          <section className="dash-panel h-full">
            <div className="flex h-full items-center gap-4 px-5 py-4">
              <Bone className="size-13 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className="h-2.5 w-12" />
                <Bone className="h-3.5 w-28" />
                <Bone className="h-2.5 w-24 opacity-55" />
              </div>
            </div>
          </section>
        </div>
        <div className="dash-bento-week">
          <section className="dash-panel flex h-full min-h-48 flex-col">
            <PanelHeader />
            <div className="grid h-28 flex-1 grid-cols-7 items-end gap-2 px-5 py-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Bone
                  key={i}
                  className={cn(
                    "w-full rounded-md",
                    i % 3 === 0 ? "h-14" : i % 2 === 0 ? "h-22" : "h-10",
                  )}
                />
              ))}
            </div>
          </section>
        </div>
        <div className="dash-bento-spot">
          <section className="dash-panel h-full min-h-40">
            <div className="flex h-full flex-col justify-between gap-4 px-5 py-4">
              <div className="space-y-2">
                <Bone className="h-2.5 w-16" />
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-24 opacity-55" />
              </div>
              <div className="flex items-center justify-between">
                <Bone className="size-11 rounded-full" />
                <Bone className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <DashboardAtmosphere>
        <DashboardSkeletonBody />
      </DashboardAtmosphere>
    </div>
  );
}
