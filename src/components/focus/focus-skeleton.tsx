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
      <AppPageFrame className="max-w-6xl gap-8 md:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18.5rem,22rem)] lg:gap-8">
          <section className="imx-panel px-5 py-6 sm:px-8 sm:py-8">
            <Bone className="h-5 w-28" />
            <Bone className="mt-2 h-4 w-48" />
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Bone className="h-14 rounded-xl" />
              <Bone className="h-14 rounded-xl" />
              <Bone className="h-14 rounded-xl" />
            </div>
            <div className="mt-8 flex flex-col items-center">
              <Bone className="size-64 rounded-full sm:size-72" />
              <div className="mt-8 flex items-center gap-4">
                <Bone className="size-12 rounded-full" />
                <Bone className="size-16 rounded-full" />
                <Bone className="size-12 rounded-full" />
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="imx-panel imx-panel-tight space-y-3">
              <Bone className="h-4 w-40" />
              <Bone className="h-1.5 w-full rounded-full" />
              <div className="flex justify-end gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Bone key={i} className="size-3.5 rounded-sm" />
                ))}
              </div>
            </section>
            <section className="imx-panel imx-panel-tight">
              <div className="flex items-center justify-between">
                <Bone className="h-4 w-24" />
                <Bone className="size-9 rounded-full" />
              </div>
              <Bone className="mt-3 h-1.5 w-full rounded-full" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Bone key={i} className="h-11 rounded-xl" />
                ))}
              </div>
            </section>
            <section className="imx-panel imx-panel-tight">
              <Bone className="h-4 w-28" />
              <Bone className="mt-2 h-3 w-40" />
            </section>
          </aside>
        </div>

        <section className="imx-panel">
          <Bone className="mb-4 h-4 w-32" />
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
        </section>
      </AppPageFrame>
    </div>
  );
}
