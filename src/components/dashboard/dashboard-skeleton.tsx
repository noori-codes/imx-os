import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

function QuadCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`dash-quad-cell ${className ?? ""}`}>
      <div className="flex min-h-[14.5rem] w-full flex-1 flex-col lg:min-h-[16rem]">
        {children}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="imx-skeleton dashboard-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <AppPageFrame className="max-w-5xl gap-10 md:py-8">
        <div className="relative overflow-hidden rounded-[1.35rem] px-5 py-6 sm:px-7 sm:py-8">
          <Bone className="absolute inset-0 rounded-[1.35rem] opacity-40" />
          <div className="relative space-y-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="mx-auto space-y-2 sm:mx-0">
                <Bone className="mx-auto h-8 w-56 sm:mx-0" />
                <Bone className="mx-auto h-3.5 w-36 opacity-60 sm:mx-0" />
              </div>
              <Bone className="mx-auto h-10 w-28 rounded-full sm:mx-0" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="mx-auto space-y-2 sm:mx-0">
                <Bone className="mx-auto h-2.5 w-16 sm:mx-0" />
                <Bone className="mx-auto h-14 w-28 sm:mx-0 sm:h-16" />
              </div>
              <div className="grid grid-cols-2 gap-6 sm:min-w-[11rem] sm:gap-8">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2 text-center sm:text-left">
                    <Bone className="mx-auto h-2.5 w-10 sm:mx-0" />
                    <Bone className="mx-auto h-6 w-12 sm:mx-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dash-quad grid grid-cols-1 border-t border-border/30 lg:grid-cols-2 lg:grid-rows-[1fr_1fr]">
          <QuadCell className="border-b border-border/30 lg:border-r">
            <Bone className="h-2.5 w-14" />
            <div className="mt-3 border-t border-border/30">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/20 py-3"
                >
                  <Bone className="size-4 shrink-0 rounded-full" />
                  <Bone className="h-2.5 w-[65%]" />
                </div>
              ))}
            </div>
          </QuadCell>

          <QuadCell className="border-b border-border/30">
            <Bone className="h-2.5 w-14" />
            <div className="mt-3 border-t border-border/30">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/20 py-3"
                >
                  <Bone className="size-4 shrink-0 rounded-full" />
                  <Bone className="h-2.5 w-[55%]" />
                </div>
              ))}
            </div>
          </QuadCell>

          <QuadCell className="border-b border-border/30 lg:border-r lg:border-b-0">
            <Bone className="h-2.5 w-12" />
            <div className="mt-3 flex flex-1 flex-col border-t border-border/30 pt-4">
              <div className="grid min-h-[7.5rem] flex-1 grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex min-h-0 flex-col gap-2">
                    <Bone className="min-h-0 w-full flex-1 rounded-lg" />
                    <Bone className="mx-auto h-2.5 w-5 opacity-60" />
                  </div>
                ))}
              </div>
            </div>
          </QuadCell>

          <QuadCell className="border-b border-border/30 lg:border-b-0">
            <Bone className="h-2.5 w-14" />
            <div className="mt-3 border-t border-border/30">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-2.5 border-b border-border/20 py-3"
                >
                  <div className="flex justify-between gap-3">
                    <Bone className="h-2.5 w-[55%]" />
                    <Bone className="h-2.5 w-7" />
                  </div>
                  <Bone className="h-px w-full" />
                </div>
              ))}
            </div>
          </QuadCell>
        </div>

        <div className="flex justify-end">
          <Bone className="h-3 w-20" />
        </div>
      </AppPageFrame>
    </div>
  );
}
