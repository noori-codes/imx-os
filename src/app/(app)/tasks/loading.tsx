import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={`imx-skeleton-bone ${className ?? ""}`} aria-hidden="true" />;
}

export default function TasksLoading() {
  return (
    <>
      <Header title="Tasks" />
      <div
        className="imx-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading tasks"
      >
        <AppPageFrame className="max-w-5xl gap-10 md:py-8">
          <div className="relative overflow-hidden rounded-[1.35rem] px-5 py-6 sm:px-8 sm:py-8">
            <Bone className="absolute inset-0 rounded-[1.35rem] opacity-40" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="mx-auto space-y-3 sm:mx-0">
                <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
                <Bone className="mx-auto h-14 w-20 sm:mx-0 sm:h-16" />
                <Bone className="mx-auto h-3.5 w-24 opacity-60 sm:mx-0" />
              </div>
              <Bone className="mx-auto h-9 w-64 max-w-full rounded-full sm:mx-0" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Bone className="h-12 min-w-0 flex-1 rounded-md" />
              <Bone className="h-10 w-16 shrink-0 rounded-full" />
            </div>
            <div className="mt-4 flex gap-1.5 border-t border-border/30 pt-4">
              <Bone className="h-7 w-14 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
            </div>
          </div>

          <div className="border-t border-border/30 pt-8">
            <div className="mb-2 flex justify-between">
              <Bone className="h-2.5 w-12" />
              <Bone className="h-2.5 w-4" />
            </div>
            <div className="border-t border-border/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/20 py-3"
                >
                  <Bone className="size-5 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bone className="h-3 w-[65%]" />
                    <Bone className="h-2 w-24 opacity-50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AppPageFrame>
      </div>
    </>
  );
}
