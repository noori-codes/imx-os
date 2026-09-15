import {
  FocusStatsChunkFallback,
  FocusTimerChunkFallback,
} from "@/components/focus/focus-chunk-fallbacks";
import { AppPageFrame } from "@/components/shared/app-page-frame";
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
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
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
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
                <Bone className="h-3 w-32" />
                <Bone className="mt-3 h-10 w-full rounded-xl" />
                <Bone className="mt-3 h-10 w-36 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </AppPageFrame>
    </div>
  );
}
