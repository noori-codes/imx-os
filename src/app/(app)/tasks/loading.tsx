import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
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
        <AppPageFrame className="max-w-3xl gap-8 md:py-8">
          <div className="space-y-2 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-12 sm:mx-0" />
            <Bone className="mx-auto h-8 w-56 max-w-full sm:mx-0" />
            <Bone className="mx-auto h-3.5 w-24 opacity-60 sm:mx-0" />
          </div>

          <div className="flex gap-4 border-b border-border/40 pb-2">
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-16" />
            <Bone className="h-4 w-8" />
          </div>

          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Bone className="h-11 min-w-0 flex-1 rounded-md" />
              <Bone className="h-9 w-16 shrink-0 rounded-full" />
            </div>
            <div className="mt-3 flex gap-1.5 border-t border-border/30 pt-3">
              <Bone className="h-6 w-14 rounded-full" />
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-6 w-16 rounded-full" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <Bone className="h-2.5 w-12" />
              <Bone className="h-2.5 w-4" />
            </div>
            <div className="border-t border-border/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/20 py-3"
                >
                  <Bone className="size-4 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bone className="h-2.5 w-[70%]" />
                    <Bone className="h-2 w-20 opacity-50" />
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
