import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

/**
 * Soft-nav fallback for the (app) shell.
 * Must never be null — a blank main is what looked like a white top-bar flash
 * while destination loading.tsx / RSC still streamed in.
 */
function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

export default function AppLoading() {
  return (
    <>
      <Header chrome title="Loading" />
      <div
        className="imx-skeleton flex min-h-0 flex-1 flex-col"
        role="status"
        aria-live="polite"
        aria-label="Loading page"
      >
        <AppPageFrame>
          <div className="space-y-3 rounded-2xl border border-border/40 p-5 sm:p-7">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-56 max-w-full" />
            <Bone className="h-3.5 w-72 max-w-full opacity-60" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Bone className="h-16 w-full rounded-xl" />
              <Bone className="h-16 w-full rounded-xl" />
              <Bone className="h-16 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/40 p-4 sm:p-5">
            <Bone className="h-4 w-32" />
            <Bone className="h-28 w-full rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <Bone className="size-5 shrink-0 rounded-full" />
                <Bone className="h-3 w-[58%]" />
              </div>
            ))}
          </div>
        </AppPageFrame>
      </div>
    </>
  );
}
