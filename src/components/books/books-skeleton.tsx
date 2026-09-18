import { BooksStage } from "@/components/books/books-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function BooksSkeletonBody() {
  return (
    <>
      <div className="books-pulse relative overflow-hidden rounded-[1.75rem] imx-surface px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-2 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
            <Bone className="mx-auto h-8 w-28 sm:mx-0 sm:h-9" />
          </div>
          <Bone className="mx-auto h-10 w-28 rounded-xl sm:mx-0" />
        </div>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-7 w-40 sm:mx-0" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Bone className="mx-auto h-2 w-12 sm:mx-0" />
                  <Bone className="mx-auto h-5 w-8 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="mx-auto size-32 shrink-0 rounded-full sm:mx-0" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <Bone className="h-9 w-full max-w-md rounded-xl" />
        <div className="flex gap-2">
          <Bone className="h-9 w-40 rounded-xl" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl imx-surface">
        <div className="grid grid-cols-6 gap-3 border-b border-border/40 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-2.5 w-14" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-3 border-b border-border/30 px-4 py-3 last:border-b-0"
          >
            <Bone className="h-3 w-[80%]" />
            <Bone className="h-3 w-[60%]" />
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-12" />
            <Bone className="h-3 w-10" />
          </div>
        ))}
      </div>
    </>
  );
}

export function BooksSkeleton() {
  return (
    <div
      className="imx-skeleton books-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading books"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <BooksStage>
          <BooksSkeletonBody />
        </BooksStage>
      </AppPageFrame>
    </div>
  );
}
