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
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 text-center sm:text-left">
              <Bone className="mx-auto h-2.5 w-12 sm:mx-0" />
              <Bone className="mx-auto h-8 w-64 max-w-full sm:mx-0" />
              <Bone className="mx-auto h-4 w-72 max-w-full opacity-60 sm:mx-0" />
            </div>
            <Bone className="mx-auto h-9 w-24 rounded-full sm:mx-0" />
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 text-center sm:text-left">
                <Bone className="mx-auto h-2.5 w-10 sm:mx-0" />
                <Bone className="mx-auto h-8 w-14 sm:mx-0" />
                <Bone className="mx-auto h-3 w-16 opacity-60 sm:mx-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid items-start gap-8 border-t border-border/30 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:gap-10">
          <section className="space-y-3">
            <Bone className="h-2.5 w-14" />
            <Bone className="h-3 w-24 opacity-60" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Bone className="size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Bone className="h-3.5 w-[70%] max-w-[16rem]" />
                    <Bone className="h-3 w-24 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-3">
            <Bone className="h-2.5 w-14" />
            <Bone className="h-3 w-20 opacity-60" />
            <div className="space-y-2 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <Bone className="size-7 shrink-0 rounded-full" />
                  <Bone className="h-3.5 min-w-0 flex-1" />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="grid items-start gap-8 border-t border-border/30 pt-8 lg:grid-cols-2 lg:gap-10">
          <section className="space-y-4">
            <Bone className="h-2.5 w-16" />
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Bone className="h-2.5 w-6 opacity-60" />
                  <Bone className="h-10 w-full rounded-sm sm:h-12" />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <Bone className="h-2.5 w-14" />
            {Array.from({ length: 3 }).map((_, i) => (
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
      </AppPageFrame>
    </div>
  );
}
