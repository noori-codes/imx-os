import { FocusPageFrame, FocusWorkspace } from "@/components/focus/focus-page-frame";

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
        <FocusWorkspace
          stage={
            <section className="relative overflow-hidden rounded-4xl border border-border/60 bg-card px-6 py-10 sm:px-12 sm:py-12">
              <div className="flex flex-col items-center">
                <Bone className="h-10 w-64 rounded-full" />
                <div className="mt-5 flex gap-2">
                  <Bone className="size-2 rounded-full" />
                  <Bone className="size-2 rounded-full" />
                  <Bone className="size-2 rounded-full" />
                  <Bone className="size-2 rounded-full" />
                </div>
                <Bone className="mt-10 size-64 rounded-full sm:size-72" />
                <Bone className="mt-8 h-10 w-full max-w-sm rounded-full" />
                <div className="mt-6 flex gap-2">
                  <Bone className="h-8 w-14 rounded-full" />
                  <Bone className="h-8 w-14 rounded-full" />
                  <Bone className="h-8 w-14 rounded-full" />
                  <Bone className="h-8 w-14 rounded-full" />
                </div>
                <div className="mt-10 flex items-center gap-4">
                  <Bone className="size-12 rounded-full" />
                  <Bone className="size-16 rounded-full" />
                  <Bone className="size-12 rounded-full" />
                </div>
              </div>
            </section>
          }
          rail={
            <>
              <div className="grid grid-cols-3 gap-2">
                <Bone className="h-18 rounded-2xl" />
                <Bone className="h-18 rounded-2xl" />
                <Bone className="h-18 rounded-2xl" />
              </div>
              <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
                <Bone className="h-3 w-16" />
                <div className="mt-5 flex items-center gap-4">
                  <Bone className="size-16 rounded-2xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Bone className="h-4 w-24" />
                    <Bone className="h-3 w-16" />
                  </div>
                </div>
                <Bone className="mt-6 h-2 w-full rounded-full" />
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Bone className="h-16 rounded-2xl" />
                  <Bone className="h-16 rounded-2xl" />
                  <Bone className="h-16 rounded-2xl" />
                  <Bone className="h-16 rounded-2xl" />
                </div>
              </section>
              <Bone className="h-14 rounded-2xl" />
            </>
          }
        />

        <section className="rounded-[1.75rem] border border-border/60 bg-card px-5 py-6 sm:px-6">
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
