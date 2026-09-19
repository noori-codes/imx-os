import { Header } from "@/components/layout/header";
import { NotesStage } from "@/components/notes/notes-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

export function NoteDetailSkeleton() {
  return (
    <>
      <Header chrome title="Note" />
      <div
        className="imx-skeleton notes-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading note"
      >
        <AppPageFrame className="max-w-4xl gap-5 md:py-8">
          <NotesStage>
            <div className="flex items-center justify-between gap-3">
              <Bone className="h-3 w-36" />
              <Bone className="h-8 w-28 rounded-xl" />
            </div>
            <div className="notes-editor notes-studio relative overflow-hidden rounded-[1.75rem] imx-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 px-5 py-3.5 sm:px-8 sm:py-4">
                <div className="space-y-2">
                  <Bone className="h-2.5 w-14" />
                  <Bone className="h-3 w-40 opacity-55" />
                  <Bone className="h-3 w-28 opacity-40" />
                </div>
                <div className="flex gap-1.5">
                  <Bone className="h-9 w-20 rounded-xl" />
                  <Bone className="size-9 rounded-xl" />
                  <Bone className="size-9 rounded-xl" />
                  <Bone className="size-9 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4 px-5 pt-8 sm:px-10 sm:pt-10">
                <Bone className="h-10 w-72 max-w-full sm:h-11" />
              </div>
              <div className="px-3 pb-6 sm:px-6 sm:pb-8">
                <div className="mt-5 space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Bone key={i} className="size-8 rounded-lg" />
                    ))}
                  </div>
                  <Bone className="min-h-[min(70vh,36rem)] w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </NotesStage>
        </AppPageFrame>
      </div>
    </>
  );
}
