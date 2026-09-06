import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("imx-skeleton-bone", className)}
      aria-hidden="true"
    />
  );
}

type AppRouteSkeletonProps = {
  title: string;
  description?: string;
};

/** Lightweight loading shell for routes without a custom skeleton. */
export function AppRouteSkeleton({ title, description }: AppRouteSkeletonProps) {
  return (
    <>
      <Header title={title} description={description} />
      <div
        className="imx-skeleton"
        role="status"
        aria-live="polite"
        aria-label={`Loading ${title.toLowerCase()}`}
      >
        <AppPageFrame className="gap-8">
          <div className="space-y-3">
            <Bone className="h-3 w-24" />
            <Bone className="h-8 w-48 max-w-full" />
            <Bone className="h-3.5 w-72 max-w-full opacity-60" />
          </div>
          <div className="space-y-3 rounded-2xl border border-border/40 p-4 sm:p-5">
            <Bone className="h-4 w-32" />
            <Bone className="h-24 w-full rounded-xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Bone className="h-16 w-full rounded-xl" />
              <Bone className="h-16 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-2 border-t border-border/30 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Bone className="size-5 shrink-0 rounded-full" />
                <Bone className="h-3 w-[62%]" />
              </div>
            ))}
          </div>
        </AppPageFrame>
      </div>
    </>
  );
}
