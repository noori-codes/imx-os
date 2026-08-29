import { AppPageFrame } from "@/components/shared/app-page-frame";

function Bone({ className }: { className?: string }) {
  return <div className={`imx-skeleton-bone ${className ?? ""}`} aria-hidden="true" />;
}

export function HabitsSkeleton() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading habits"
    >
      <AppPageFrame>
        <div className="flex gap-4 border-b border-border/60 pb-2">
          <Bone className="h-4 w-14" />
          <Bone className="h-4 w-16" />
        </div>
        <Bone className="h-10 w-full rounded-md" />
        <div>
          <Bone className="mb-3 h-4 w-20" />
          <div className="border-t border-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-border/50 py-3.5"
              >
                <Bone className="size-8 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-40" />
                  <Bone className="h-3 w-24" />
                  <Bone className="h-1.5 w-full max-w-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppPageFrame>
    </div>
  );
}
