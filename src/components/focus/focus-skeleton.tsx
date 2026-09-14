import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

export function FocusSkeleton() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading focus"
    >
      <Header title="Focus" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <div className="space-y-2">
          <Bone className="h-2.5 w-24" />
          <Bone className="h-8 w-28 sm:h-9" />
          <Bone className="h-3.5 w-72 max-w-full opacity-55" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4"
            >
              <Bone className="h-2.5 w-14" />
              <Bone className="mt-2 h-7 w-12" />
              <Bone className="mt-2 h-2.5 w-20 opacity-55" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 sm:p-7 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Bone className="mx-auto size-[14.5rem] rounded-full sm:size-[16.5rem] lg:mx-0" />
            <div className="space-y-4">
              <Bone className="h-9 w-28" />
              <Bone className="h-12 w-full rounded-xl" />
              <Bone className="h-14 w-40 rounded-full" />
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8">
          <Bone className="h-3 w-24" />
          <Bone className="mt-4 h-40 w-full rounded-2xl" />
        </div>
      </AppPageFrame>
    </div>
  );
}
