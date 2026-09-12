import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function BooksSkeletonBody() {
  return (
    <div className="books-stage-content flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <Bone className="h-2.5 w-24" />
        <Bone className="h-8 w-36 sm:h-9" />
        <Bone className="h-3.5 w-64 max-w-full opacity-55" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <Bone className="h-2.5 w-16" />
            <Bone className="mt-2 h-7 w-12" />
            <Bone className="mt-2 h-2.5 w-20 opacity-55" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <Bone className="h-9 w-full max-w-md rounded-xl" />
        <div className="flex gap-2">
          <Bone className="h-9 w-40 rounded-xl" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80">
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
    </div>
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
        <BooksSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
