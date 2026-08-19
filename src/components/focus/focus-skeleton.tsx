import { FocusPageFrame } from "@/components/focus/focus-page-frame";

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
      <FocusPageFrame>
        <div className="mx-auto w-full max-w-4xl">
          <section className="relative overflow-hidden rounded-4xl border border-border/60 bg-card px-6 py-10 sm:px-12 sm:py-12">
            <div className="flex flex-col items-center">
              <Bone className="h-10 w-64 rounded-full" />
              <div className="mt-5 flex gap-2">
                <Bone className="size-2 rounded-full" />
                <Bone className="size-2 rounded-full" />
                <Bone className="size-2 rounded-full" />
                <Bone className="size-2 rounded-full" />
              </div>
              <Bone className="mt-8 size-64 rounded-full sm:size-72" />
              <Bone className="mt-4 h-10 w-full max-w-sm rounded-full" />
              <div className="mt-4 flex gap-2">
                <Bone className="h-8 w-14 rounded-full" />
                <Bone className="h-8 w-14 rounded-full" />
                <Bone className="h-8 w-14 rounded-full" />
                <Bone className="h-8 w-14 rounded-full" />
              </div>
              <div className="mt-8 flex items-center gap-4">
                <Bone className="size-12 rounded-full" />
                <Bone className="size-16 rounded-full" />
                <Bone className="size-12 rounded-full" />
              </div>
            </div>
          </section>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-4">
            <section className="rounded-[1.75rem] border border-border/60 bg-card p-4">
              <Bone className="h-3 w-28" />
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <Bone className="h-18 rounded-2xl" />
                <Bone className="h-18 rounded-2xl" />
                <Bone className="h-18 rounded-2xl" />
              </div>
            </section>
            <Bone className="h-14 rounded-[1.75rem]" />
          </div>

          <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Bone className="h-3 w-16" />
                <Bone className="h-5 w-32" />
              </div>
              <Bone className="size-10 rounded-full" />
            </div>
            <div className="mt-4 rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <Bone className="size-14 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <Bone className="mt-4 h-2 w-full rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          </section>
        </div>

        <section className="mx-auto w-full max-w-4xl rounded-[1.75rem] border border-border/60 bg-card px-5 py-6 sm:px-6">
          <Bone className="h-3 w-16" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Bone className="size-9 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-32" />
                  <Bone className="h-3 w-48 max-w-full" />
                </div>
                <Bone className="h-3 w-16" />
              </div>
            ))}
          </div>
        </section>
      </FocusPageFrame>
    </div>
  );
}
