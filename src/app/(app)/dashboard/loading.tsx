export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="sticky top-14 z-[9] border-b border-border/60">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4 md:px-8">
          <div className="flex gap-4">
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="hidden h-4 w-20 rounded bg-muted sm:block" />
          </div>
          <div className="h-8 w-20 rounded-md bg-muted" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-8">
        <div className="flex justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-md bg-muted" />
            <div className="h-4 w-72 rounded-md bg-muted/70" />
          </div>
          <div className="hidden gap-2 sm:flex">
            <div className="h-8 w-16 rounded-md bg-muted" />
            <div className="h-8 w-16 rounded-md bg-muted" />
            <div className="h-8 w-16 rounded-md bg-muted" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-y border-border/60 py-5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-8 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:gap-14">
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="h-4 w-40 rounded bg-muted/70" />
              <div className="h-24 rounded-lg bg-muted/40" />
            </div>
            <div className="h-28 rounded-lg bg-muted/30" />
          </div>
          <div className="space-y-8 lg:border-l lg:border-border/60 lg:pl-10">
            <div className="h-40 rounded-lg bg-muted/40" />
            <div className="h-20 rounded-lg bg-muted/30" />
            <div className="h-24 rounded-lg bg-muted/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
