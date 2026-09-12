import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />;
}

function NotesSkeletonBody() {
  return (
    <div className="notes-stage-content flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Bone className="h-2.5 w-24" />
          <Bone className="h-8 w-36 sm:h-9" />
          <Bone className="h-3.5 w-56 max-w-full opacity-55" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 w-28 rounded-xl" />
          <Bone className="h-10 w-32 rounded-xl" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <Bone className="h-2.5 w-14" />
            <Bone className="mt-2 h-7 w-12" />
            <Bone className="mt-2 h-2.5 w-16 opacity-55" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-card/80 p-5 sm:p-6">
        <Bone className="h-2.5 w-28" />
        <Bone className="mt-3 h-6 w-48 max-w-full" />
        <Bone className="mt-3 h-3.5 w-72 max-w-full opacity-55" />
        <Bone className="mt-5 h-10 w-36 rounded-xl" />
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
    </div>
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
        <NotesSkeletonBody />
      </AppPageFrame>
    </div>
  );
}
