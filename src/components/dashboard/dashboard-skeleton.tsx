function Bone({ className }: { className?: string }) {
  return (
    <div className={`rounded-md ${className ?? ""}`} aria-hidden="true" />
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <div className="sticky top-14 z-[9] border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Bone className="h-3.5 w-16" />
            <span className="hidden h-3 w-px bg-border sm:block" />
            <Bone className="h-3.5 w-10" />
            <span className="hidden h-3 w-px bg-border md:block" />
            <Bone className="hidden h-3.5 w-14 md:block" />
          </div>
          <Bone className="h-8 w-[4.75rem]" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Bone className="h-9 w-72 max-w-full" />
            <Bone className="h-4 w-56 max-w-full opacity-60" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-8 w-[4.25rem]" />
            <Bone className="h-8 w-[4.25rem]" />
            <Bone className="h-8 w-[4.5rem]" />
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18.5rem,22rem)] lg:gap-6">
          <section className="imx-panel space-y-3">
            <Bone className="h-4 w-16" />
            <Bone className="h-3 w-24 opacity-60" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Bone className="size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Bone className="h-3.5 w-[70%] max-w-[16rem]" />
                    <Bone className="h-3 w-24 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="imx-panel imx-panel-tight space-y-3">
            <Bone className="h-4 w-16" />
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

        <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
          <section className="imx-panel space-y-4">
            <div className="flex items-baseline justify-between">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-12 opacity-60" />
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Bone className="h-2.5 w-6 opacity-60" />
                  <Bone className="h-10 w-full max-w-4 rounded-sm opacity-80 sm:h-12" />
                  <Bone className="h-3 w-3" />
                </div>
              ))}
            </div>
          </section>

          <section className="imx-panel space-y-4">
            <Bone className="h-4 w-16" />
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

        <section className="imx-panel space-y-3">
          <div className="flex flex-col items-center gap-2.5">
            <Bone className="h-4 w-20" />
            <Bone className="h-3 w-48 opacity-60" />
            <Bone className="mt-1 h-7 w-24" />
          </div>
        </section>
      </div>

      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
