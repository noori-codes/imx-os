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
      className="imx-skeleton focus-board w-full"
      role="status"
      aria-label="Loading timer"
    >
      <Bone className="h-7 w-full rounded-full" />
      <div className="focus-board-stack">
        <Bone className="h-3 w-48" />
        <Bone className="size-[12rem] rounded-full sm:size-[13rem]" />
        <div className="flex gap-1.5">
          <Bone className="h-7 w-20 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
        <Bone className="h-10 w-full max-w-sm rounded-full" />
        <Bone className="h-10 w-full max-w-sm rounded-xl" />
      </div>
    </div>
  );
}

/** Placeholder while FocusStats / pulse chunk loads. */
export function FocusStatsChunkFallback() {
  return (
    <div
      className="imx-skeleton flex flex-col gap-4"
      role="status"
      aria-label="Loading pulse"
    >
      <div className="space-y-2">
        <Bone className="h-2 w-14" />
        <Bone className="h-3 w-28" />
        <div className="relative aspect-[100/58] w-full">
          <Bone className="absolute inset-x-[14%] bottom-[14%] top-[10%] rounded-t-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Bone className="h-2 w-12" />
        <Bone className="h-6 w-28" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
