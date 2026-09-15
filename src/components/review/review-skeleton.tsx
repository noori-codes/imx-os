import { ReviewStage } from "@/components/review/review-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function ReviewSkeletonBody() {
  return (
    <>
      <div className="review-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-2">
            <Bone className="h-2.5 w-28" />
            <div className="flex items-center gap-2">
              <Bone className="h-8 w-52 sm:h-9" />
              <Bone className="size-9 rounded-xl" />
              <Bone className="size-9 rounded-xl" />
            </div>
          </div>
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-7 w-40 sm:mx-0" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Bone className="mx-auto h-2 w-10 sm:mx-0" />
                  <Bone className="mx-auto h-5 w-8 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="mx-auto size-32 shrink-0 rounded-full sm:mx-0" />
        </div>
      </div>

      <div className="border-t border-border/30 pt-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.85fr)]">
          <div className="overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80">
            <div className="space-y-2 border-b border-border/40 px-5 py-4">
              <Bone className="h-2.5 w-20" />
              <Bone className="h-5 w-36" />
            </div>
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Bone className="h-20 w-full rounded-xl" />
                <Bone className="h-20 w-full rounded-xl" />
              </div>
              <Bone className="h-24 w-full rounded-xl" />
              <Bone className="h-24 w-full rounded-xl" />
              <Bone className="h-24 w-full rounded-xl" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80">
              <div className="space-y-2 border-b border-border/40 px-5 py-4">
                <Bone className="h-2.5 w-16" />
                <Bone className="h-4 w-28" />
              </div>
              <div className="space-y-3 px-5 py-4">
                <Bone className="h-10 w-full rounded-xl" />
                <Bone className="h-4 w-48 max-w-full" />
                <Bone className="h-4 w-40 max-w-full" />
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80">
              <div className="space-y-2 border-b border-border/40 px-5 py-4">
                <Bone className="h-2.5 w-16" />
                <Bone className="h-4 w-32" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-border/30 px-5 py-3 last:border-b-0"
                >
                  <Bone className="h-3 w-28" />
                  <Bone className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ReviewSkeleton() {
  return (
    <div
      className="imx-skeleton review-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading review"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <ReviewStage>
          <ReviewSkeletonBody />
        </ReviewStage>
      </AppPageFrame>
    </div>
  );
}
