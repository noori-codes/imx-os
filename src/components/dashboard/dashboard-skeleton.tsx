import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
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
        <div className="relative overflow-hidden rounded-[1.35rem] px-5 py-6 sm:px-7 sm:py-8">
          <Bone className="absolute inset-0 rounded-[1.35rem] opacity-40" />
          <div className="relative space-y-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="mx-auto space-y-2 sm:mx-0">
                <Bone className="mx-auto h-8 w-56 sm:mx-0" />
                <Bone className="mx-auto h-3.5 w-36 opacity-60 sm:mx-0" />
              </div>
              <Bone className="mx-auto h-10 w-28 rounded-full sm:mx-0" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="mx-auto space-y-2 sm:mx-0">
                <Bone className="mx-auto h-2.5 w-16 sm:mx-0" />
                <Bone className="mx-auto h-14 w-28 sm:mx-0 sm:h-16" />
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
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
          <section className="space-y-3">
            <Bone className="h-2.5 w-14" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Bone className="size-8 shrink-0 rounded-full" />
                  <Bone className="h-3.5 w-[70%] max-w-[16rem]" />
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-3">
            <Bone className="h-2.5 w-14" />
            <div className="flex flex-wrap gap-2.5 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Bone key={i} className="size-9 rounded-full" />
              ))}
            </div>
          </aside>
        </div>

        <div className="grid items-start gap-10 border-t border-border/30 pt-8 lg:grid-cols-2 lg:gap-12">
          <section className="space-y-4">
            <Bone className="h-2.5 w-12" />
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Bone className="h-20 w-full rounded-lg sm:h-24" />
                  <Bone className="h-2.5 w-6 opacity-60" />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <Bone className="h-2.5 w-14" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between gap-3">
                  <Bone className="h-3.5 w-32" />
                  <Bone className="h-3 w-8" />
                </div>
                <Bone className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </section>
        </div>

        <div className="flex justify-end border-t border-border/30 pt-8">
          <Bone className="h-3 w-20" />
        </div>
      </AppPageFrame>
    </div>
  );
}
