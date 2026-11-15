import {
  FocusStatsChunkFallback,
  FocusTimerChunkFallback,
} from "@/components/focus/focus-chunk-fallbacks";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

export function FocusSkeleton() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading focus"
    >
      <div
        className={cn(
          "focus-page-frame flex w-full min-w-0 max-w-none flex-1 flex-col",
          "px-4 pt-4 pb-[calc(1.25rem+var(--mobile-tab-h))] sm:px-5",
          "md:px-6 md:pt-5 md:pb-8",
          "lg:px-8 lg:pt-6 lg:pb-10",
        )}
      >
        <div className="focus-studio">
          <div className="focus-studio-wash" aria-hidden="true" />
          <div className="focus-studio-glow" aria-hidden="true" />
          <div className="focus-studio-glow-soft" aria-hidden="true" />
          <div className="focus-studio-content flex w-full flex-col gap-8">
            <div className="w-full">
              <FocusTimerChunkFallback />
            </div>

            <div className="w-full border-t border-border/40 pt-8">
              <FocusStatsChunkFallback />
            </div>

            <div className="w-full space-y-6" id="focus-recent-sessions">
              <div className="space-y-3">
                <Bone className="h-3 w-28" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Bone key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl imx-surface p-4 sm:p-5">
                <Bone className="h-3 w-32" />
                <Bone className="mt-3 h-10 w-full rounded-xl" />
                <Bone className="mt-3 h-10 w-36 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
