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
          <section className="flex min-h-[28rem] flex-col items-center justify-center px-2 py-6 sm:min-h-[32rem] sm:px-4 sm:py-8">
            <Bone className="h-3 w-28" />
            <Bone className="mt-4 h-12 w-full max-w-md rounded-2xl" />
            <Bone className="mt-3 h-9 w-56 rounded-xl" />
            <Bone className="mt-8 size-[17.5rem] rounded-full sm:size-[19.5rem]" />
            <div className="mt-8 flex items-center gap-4">
              <Bone className="size-12 rounded-full" />
              <Bone className="size-16 rounded-full" />
              <Bone className="size-12 rounded-full" />
            </div>
            <Bone className="mt-3 h-3 w-28" />
            <div className="mt-auto flex w-full max-w-xl flex-col pt-10">
              <Bone className="h-3 w-24" />
              <Bone className="mt-2 h-3 w-40 opacity-60" />
              <div className="mt-5 grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Bone className="size-12 rounded-full" />
                    <Bone className="h-2.5 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-8">
            <section className="space-y-4">
              <Bone className="h-3 w-20" />
              <Bone className="h-8 w-24" />
              <Bone className="h-4 w-40 opacity-60" />
              <Bone className="h-3 w-32 opacity-50" />
              <Bone className="mt-2 h-1 w-full rounded-full" />
              <div className="flex items-center justify-between gap-2 pt-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Bone key={i} className="size-2 rounded-full" />
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section>
          <Bone className="mb-2 h-3 w-28" />
          <Bone className="mb-6 h-4 w-20 opacity-60" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5"
              >
                <Bone className="size-2 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-3 w-40 max-w-full" />
                </div>
                <Bone className="h-4 w-12" />
              </div>
            ))}
          </div>
          <Bone className="mt-8 h-4 w-52 opacity-60" />
        </section>
      </AppPageFrame>
    </div>
  );
}
