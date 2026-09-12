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
      className="imx-skeleton grid w-full gap-8 px-1 py-4 sm:px-2 sm:py-6 lg:grid-cols-2 lg:items-center lg:gap-8 xl:gap-10"
      role="status"
      aria-label="Loading timer"
    >
      <div className="flex flex-col gap-3">
        <div className="text-center lg:text-left">
          <Bone className="mx-auto h-2.5 w-14 lg:mx-0" />
          <Bone className="mx-auto mt-2 h-4 w-28 opacity-60 lg:mx-0" />
        </div>
        <Bone className="mx-auto size-[16rem] rounded-full sm:size-[18.5rem] lg:mx-0 lg:size-[22rem]" />
      </div>
      <div className="flex flex-col gap-5">
        <Bone className="mx-auto h-8 w-28 lg:mx-0" />
        <Bone className="h-12 w-full rounded-2xl" />
        <div className="mx-auto flex items-center gap-4 lg:mx-0">
          <Bone className="size-12 rounded-full" />
          <Bone className="size-16 rounded-full" />
          <Bone className="size-12 rounded-full" />
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
