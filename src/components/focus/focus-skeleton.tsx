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
          "px-4 pt-3 pb-[calc(0.85rem+var(--mobile-tab-h))] sm:px-5",
          "md:px-6 md:pt-4 md:pb-5",
          "lg:px-7 lg:pt-4 lg:pb-6",
        )}
      >
        <div className="focus-studio">
          <div className="focus-studio-wash" aria-hidden="true" />
          <div className="focus-studio-content focus-desk">
            <div className="focus-desk-board min-w-0">
              <FocusTimerChunkFallback />
            </div>
            <div className="focus-desk-pulse focus-surface min-w-0">
              <FocusStatsChunkFallback />
            </div>
            <div
              className="focus-desk-log focus-surface min-w-0 space-y-3"
              id="focus-recent-sessions"
            >
              <Bone className="h-2.5 w-28" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Bone key={i} className="h-11 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
