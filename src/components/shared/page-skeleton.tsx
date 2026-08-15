export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col animate-pulse">
      <div className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-md bg-muted" />
          <div className="hidden h-3 w-48 rounded-md bg-muted sm:block" />
        </div>
        <div className="flex gap-2">
          <div className="hidden h-9 w-40 rounded-md bg-muted sm:block" />
          <div className="size-9 rounded-md bg-muted" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-24 rounded-xl border bg-muted/40" />
          <div className="h-24 rounded-xl border bg-muted/40" />
          <div className="h-24 rounded-xl border bg-muted/40" />
        </div>
        <div className="h-64 rounded-xl border bg-muted/30" />
        <div className="h-40 rounded-xl border bg-muted/20" />
      </div>
    </div>
  );
}
