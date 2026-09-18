function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`imx-skeleton-bone ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

/** Placeholder while the FocusTimer chunk loads. */
export function FocusTimerChunkFallback() {
  return (
    <div
      className="imx-skeleton overflow-hidden rounded-2xl imx-surface p-5 sm:p-7 lg:p-8"
      role="status"
      aria-label="Loading timer"
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10">
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <Bone className="h-2.5 w-16" />
          <Bone className="size-[14.5rem] rounded-full sm:size-[16.5rem]" />
        </div>
        <div className="flex flex-col gap-5">
          <Bone className="h-9 w-28" />
          <Bone className="h-12 w-full rounded-xl" />
          <Bone className="h-9 w-full rounded-xl" />
          <div className="flex items-center gap-3">
            <Bone className="size-12 rounded-full" />
            <Bone className="h-14 w-40 rounded-full" />
            <Bone className="size-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Placeholder while FocusStats / sky chunk loads. */
export function FocusStatsChunkFallback() {
  return (
    <div
      className="imx-skeleton grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10"
      role="status"
      aria-label="Loading sky"
    >
      <div className="space-y-4">
        <Bone className="mx-auto h-2.5 w-16 lg:mx-0" />
        <div className="relative mx-auto aspect-[100/68] w-full max-w-xl lg:mx-0 lg:max-w-none">
          <Bone className="absolute inset-x-[12%] bottom-[12%] top-[8%] rounded-t-full" />
        </div>
      </div>
      <div className="space-y-5">
        <Bone className="mx-auto h-8 w-36 lg:mx-0" />
        <Bone className="h-4 w-3/4" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="h-14 w-full rounded-lg sm:h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
