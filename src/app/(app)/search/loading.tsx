import { Header } from "@/components/layout/header";
import { SearchStage } from "@/components/search/search-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function SearchSkeletonBody() {
  return (
    <>
      <div className="search-hero relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] imx-surface p-5 sm:p-7">
        <div className="space-y-5">
          <div className="space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
            <Bone className="mx-auto h-9 w-48 max-w-full sm:mx-0 sm:h-10 sm:w-56" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
          </div>
          <div className="search-composer rounded-2xl imx-surface imx-surface-rim p-2 sm:p-2.5">
            <Bone className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-3">
        <Bone className="h-2.5 w-16" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl imx-surface px-3 py-3"
            >
              <Bone className="size-9 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-3 w-16" />
                <Bone className="h-2.5 w-20 opacity-55" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-border/30 pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl imx-surface imx-surface-rim px-3 py-3"
          >
            <Bone className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bone className="h-3 w-[55%]" />
              <Bone className="h-2.5 w-24 opacity-55" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function SearchLoading() {
  return (
    <>
      <Header chrome title="Search" description="Find anything across IMX OS" />
      <div
        className="imx-skeleton search-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading search"
      >
        <AppPageFrame className="max-w-5xl gap-8 md:py-8">
          <SearchStage>
            <SearchSkeletonBody />
          </SearchStage>
        </AppPageFrame>
      </div>
    </>
  );
}
