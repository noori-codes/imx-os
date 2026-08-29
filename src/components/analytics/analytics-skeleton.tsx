import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={`imx-skeleton-bone ${className ?? ""}`} aria-hidden="true" />;
}

export function AnalyticsSkeleton() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading analytics"
    >
      <AppPageFrame className="max-w-5xl gap-10 md:py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 text-center sm:text-left">
              <Bone className="mx-auto h-2.5 w-16 sm:mx-0" />
              <Bone className="mx-auto h-5 w-72 max-w-full sm:mx-0" />
              <Bone className="mx-auto h-5 w-56 max-w-full opacity-60 sm:mx-0" />
            </div>
            <Bone className="mx-auto h-9 w-36 rounded-full sm:mx-0" />
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 text-center sm:text-left">
                <Bone className="mx-auto h-2.5 w-12 sm:mx-0" />
                <Bone className="mx-auto h-8 w-16 sm:mx-0" />
                <Bone className="mx-auto h-3 w-20 opacity-60 sm:mx-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border/30 pt-8">
          <Bone className="h-2.5 w-12" />
          <Bone className="mt-2 h-4 w-48 opacity-60" />
          <Bone className="mt-4 h-56 w-full rounded-lg" />
        </div>

        <div className="grid gap-10 border-t border-border/30 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div>
            <Bone className="h-2.5 w-14" />
            <Bone className="mt-2 h-4 w-40 opacity-60" />
            <Bone className="mt-4 h-40 w-full rounded-lg" />
          </div>
          <div>
            <Bone className="h-2.5 w-14" />
            <Bone className="mt-2 h-4 w-36 opacity-60" />
            <div className="mt-5 space-y-0 divide-y divide-border/40">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Bone className="size-2 rounded-full" />
                    <div className="space-y-1.5">
                      <Bone className="h-3.5 w-24" />
                      <Bone className="h-2.5 w-20 opacity-60" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Bone className="ml-auto h-3.5 w-8" />
                    <Bone className="ml-auto h-2.5 w-12 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8">
          <Bone className="h-2.5 w-24" />
          <Bone className="mt-2 h-4 w-36 opacity-60" />
          <Bone className="mt-4 h-40 w-full rounded-lg" />
        </div>
      </AppPageFrame>
    </div>
  );
}
