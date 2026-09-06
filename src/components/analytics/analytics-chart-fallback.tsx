function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`imx-skeleton-bone ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

/** Placeholder while a Recharts chunk loads. */
export function AnalyticsChartChunkFallback({
  label = "Loading chart",
}: {
  label?: string;
}) {
  return (
    <div
      className="imx-skeleton w-full space-y-3"
      role="status"
      aria-label={label}
    >
      <Bone className="h-2.5 w-20" />
      <Bone className="h-3 w-40 opacity-60" />
      <Bone className="h-56 w-full rounded-xl sm:h-64" />
    </div>
  );
}
