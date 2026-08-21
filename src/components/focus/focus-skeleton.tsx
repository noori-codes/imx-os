import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

export function FocusSkeleton() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading focus"
    >
      <AppPageFrame>
        <section className="border-b border-border/60 pb-8">
          <Bone className="h-5 w-28" />
          <Bone className="mt-2 h-4 w-48" />
          <div className="mt-5 flex gap-4 border-b border-border/60 pb-2">
            <Bone className="h-4 w-14" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-20" />
          </div>
          <div className="mt-8 flex flex-col items-center">
            <Bone className="size-64 rounded-full sm:size-72" />
            <div className="mt-8 flex items-center gap-4">
              <Bone className="size-12 rounded-full" />
              <Bone className="size-14 rounded-full" />
              <Bone className="size-12 rounded-full" />
            </div>
          </div>
        </section>

        <div className="space-y-3 border-b border-border/60 pb-4">
          <div className="flex gap-4">
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-28" />
            <Bone className="h-4 w-28" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Bone className="h-3 w-20" />
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Bone key={i} className="size-3.5 rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Bone className="h-4 w-28" />
          <Bone className="mt-2 h-3 w-40" />
          <div className="mt-4 space-y-0 border-t border-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/50 py-3"
              >
                <Bone className="size-8 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-3 w-16" />
                </div>
                <Bone className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-border/60 pb-5">
          <Bone className="h-4 w-36" />
          <Bone className="mt-2 h-3 w-52" />
        </div>

        <div>
          <Bone className="mb-3 h-4 w-20" />
          <div className="space-y-0 border-t border-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/50 py-3.5"
              >
                <Bone className="size-2.5 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-3 w-40 max-w-full" />
                </div>
                <Bone className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </AppPageFrame>
    </div>
  );
}
