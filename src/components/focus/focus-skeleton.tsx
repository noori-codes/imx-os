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
        <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start lg:gap-8">
          <section className="order-1 flex min-h-[28rem] flex-col px-2 py-5 sm:min-h-[34rem] sm:px-4 sm:py-8 lg:min-h-[40rem]">
            <Bone className="mx-auto h-3 w-28" />
            <Bone className="mx-auto mt-4 h-12 w-full max-w-md rounded-2xl" />
            <Bone className="mx-auto mt-3 h-9 w-56 rounded-xl" />
            <Bone className="mx-auto mt-8 size-[15.5rem] rounded-full sm:size-[17.5rem] lg:size-[19.5rem]" />
            <Bone className="mx-auto mt-3 h-3 w-36" />
            <div className="mx-auto mt-8 flex items-center gap-4">
              <Bone className="size-12 rounded-full" />
              <Bone className="size-16 rounded-full" />
              <Bone className="size-12 rounded-full" />
            </div>
            <div className="mx-auto mt-auto flex w-full max-w-xl flex-col pt-10">
              <Bone className="h-3 w-24" />
              <Bone className="mt-2 h-3 w-40 opacity-60" />
              <div className="mt-5 grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Bone className="size-11 rounded-full sm:size-12" />
                    <Bone className="h-2.5 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="order-2 flex min-h-0 w-full flex-col lg:min-h-[30rem]">
            <div className="text-center lg:text-left">
              <Bone className="mx-auto h-3 w-16 lg:mx-0" />
              <Bone className="mx-auto mt-2 h-4 w-28 opacity-60 lg:mx-0" />
            </div>

            <div className="mt-6 w-full max-lg:mx-auto max-lg:max-w-[17.5rem]">
              <div className="relative aspect-[100/68] w-full">
                <Bone className="absolute inset-x-[12%] bottom-[12%] top-[8%] rounded-t-full" />
                <Bone className="absolute bottom-[10%] left-[6%] right-[6%] h-px" />
                <Bone className="absolute bottom-[42%] left-[22%] size-1.5 rounded-full" />
                <Bone className="absolute bottom-[58%] left-[48%] size-2 rounded-full" />
                <Bone className="absolute bottom-[40%] right-[24%] size-1.5 rounded-full" />
              </div>
              <Bone className="mx-auto mt-2 h-3 w-32" />
              <div className="mt-2 grid grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <Bone className="size-7 rounded-full" />
                    <Bone className="h-2 w-8" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="flex items-baseline justify-between gap-3">
                <Bone className="h-3 w-16" />
                <Bone className="h-3 w-10" />
              </div>
              <Bone className="h-1.5 w-full rounded-full" />
              <Bone className="h-4 w-3/4 max-lg:mx-auto" />
              <Bone className="h-3 w-20 max-lg:mx-auto" />
              <div className="border-t border-border/40 pt-5">
                <Bone className="h-3 w-20" />
                <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <Bone className="h-14 w-full rounded-lg sm:h-16" />
                      <Bone className="h-2.5 w-5" />
                      <Bone className="h-2.5 w-4 opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 pt-8">
              <Bone className="h-3 w-24" />
              <Bone className="h-3 w-20" />
            </div>
          </aside>
        </div>

        <section className="mt-6 sm:mt-8">
          <Bone className="mb-2 h-3 w-28" />
          <Bone className="mb-6 h-4 w-16 opacity-60" />
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2.5 py-2.5"
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
          <Bone className="mt-8 h-4 w-56 opacity-60" />
        </section>
      </AppPageFrame>
    </div>
  );
}
