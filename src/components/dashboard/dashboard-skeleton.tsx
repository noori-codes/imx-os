function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

function SectionHeading() {
  return (
    <div className="space-y-2">
      <Bone className="h-4 w-24" />
      <Bone className="h-3 w-40 opacity-60" />
    </div>
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:gap-12 md:px-8">
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

        <div className="grid grid-cols-2 gap-6 border-y border-border/60 py-5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <Bone className="h-2.5 w-16 opacity-60" />
              <Bone className="h-8 w-14" />
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(15rem,0.9fr)] lg:gap-14">
          <div className="space-y-10">
            <section className="space-y-4">
              <SectionHeading />
              <div className="divide-y divide-border/50 border-y border-border/50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Bone className="size-8 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Bone className="h-3.5 w-[70%] max-w-[16rem]" />
                      <Bone className="h-3 w-24 opacity-60" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeading />
              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Bone className="h-2.5 w-6 opacity-60" />
                    <Bone className="h-14 w-full max-w-5 rounded-sm opacity-80" />
                    <Bone className="h-3.5 w-4" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-10 lg:border-l lg:border-border/60 lg:pl-10">
            <section className="space-y-4">
              <SectionHeading />
              <div className="flex gap-8">
                <div className="space-y-2">
                  <Bone className="h-2.5 w-12 opacity-60" />
                  <Bone className="h-7 w-10" />
                </div>
                <div className="space-y-2">
                  <Bone className="h-2.5 w-10 opacity-60" />
                  <Bone className="h-7 w-10" />
                </div>
              </div>
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <Bone className="size-7 shrink-0 rounded-full" />
                    <Bone className="h-3.5 min-w-0 flex-1" />
                    <Bone className="h-3 w-6 shrink-0 opacity-60" />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeading />
              <Bone className="h-8 w-20" />
            </section>

            <section className="space-y-4">
              <SectionHeading />
              <div className="space-y-5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between gap-3">
                      <Bone className="h-3.5 w-28" />
                      <Bone className="h-3 w-8 opacity-60" />
                    </div>
                    <Bone className="h-1.5 w-full rounded-full opacity-70" />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="space-y-4 border-t border-border/60 pt-8">
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
