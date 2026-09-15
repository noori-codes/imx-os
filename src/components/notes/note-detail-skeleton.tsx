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
        <AppPageFrame className="max-w-3xl gap-6 md:py-8">
          <NotesStage>
            <div className="flex items-center justify-between gap-3">
              <Bone className="h-3 w-36" />
              <Bone className="h-8 w-28 rounded-xl" />
            </div>
            <div className="notes-editor relative overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4 sm:px-6">
                <div className="space-y-2">
                  <Bone className="h-2.5 w-16" />
                  <Bone className="h-3 w-28 opacity-55" />
                </div>
                <div className="flex gap-2">
                  <Bone className="h-9 w-16 rounded-xl" />
                  <Bone className="h-9 w-24 rounded-xl" />
                  <Bone className="h-9 w-20 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4 px-5 pt-5 sm:px-8 sm:pt-7">
                <Bone className="h-8 w-56 max-w-full sm:h-9" />
              </div>
              <div className="px-2 pb-2 sm:px-4 sm:pb-4">
                <div className="mt-4 overflow-hidden rounded-xl border border-border/40 bg-background/40">
                  <div className="flex gap-0.5 border-b border-border/40 px-2 py-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Bone key={i} className="size-8 rounded-lg" />
                    ))}
                  </div>
                  <Bone className="min-h-80 w-full rounded-none" />
                </div>
              </div>
            </div>
          </NotesStage>
        </AppPageFrame>
      </div>
    </>
  );
}
