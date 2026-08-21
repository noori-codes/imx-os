import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

export function NotesSkeleton() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading notes"
    >
      <AppPageFrame>
        <div className="flex gap-2 border-b border-border/60 pb-5">
          <Bone className="h-9 w-28 rounded-md" />
          <Bone className="h-9 w-40 rounded-md" />
        </div>

        <div className="flex gap-4">
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-24" />
        </div>

        <div>
          <Bone className="mb-3 h-4 w-24" />
          <div className="space-y-0 border-t border-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-border/50 py-3.5"
              >
                <Bone className="size-8 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-40" />
                  <Bone className="h-3 w-64 max-w-full" />
                  <Bone className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppPageFrame>
    </div>
  );
}
