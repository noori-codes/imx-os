import { NotesStage } from "@/components/notes/notes-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function NotesSkeletonBody() {
  return (
    <>
      <div className="notes-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-2 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
            <Bone className="mx-auto h-8 w-28 sm:mx-0 sm:h-9" />
          </div>
          <div className="flex justify-center gap-2 sm:justify-end">
            <Bone className="h-10 w-28 rounded-xl" />
            <Bone className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
            <Bone className="mx-auto h-7 w-48 max-w-full sm:mx-0" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Bone className="mx-auto h-2 w-10 sm:mx-0" />
                  <Bone className="mx-auto h-5 w-8 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="mx-auto size-32 shrink-0 rounded-full sm:mx-0" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Bone className="h-9 w-52 rounded-xl" />
        <Bone className="h-9 w-64 max-w-full rounded-xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5"
          >
            <div className="flex justify-between">
              <Bone className="size-9 rounded-xl" />
              <Bone className="h-2.5 w-12" />
            </div>
            <Bone className="mt-3 h-4 w-[70%]" />
            <Bone className="mt-2 h-3 w-full" />
            <Bone className="mt-1.5 h-3 w-[80%]" />
            <Bone className="mt-4 h-2.5 w-24 opacity-55" />
          </div>
        ))}
      </div>
    </>
  );
}

export function NotesSkeleton() {
  return (
    <div
      className="imx-skeleton notes-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading notes"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <NotesStage>
          <NotesSkeletonBody />
        </NotesStage>
      </AppPageFrame>
    </div>
  );
}
