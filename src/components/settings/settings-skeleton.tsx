import { SettingsStage } from "@/components/settings/settings-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function SettingsSkeletonBody() {
  return (
    <>
      <div className="settings-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-2 text-center sm:text-left">
            <Bone className="mx-auto h-2.5 w-28 sm:mx-0" />
            <Bone className="mx-auto h-8 w-36 sm:mx-0 sm:h-9" />
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 sm:justify-end">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-9 w-14 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <Bone className="mx-auto h-7 w-40 sm:mx-0" />
            <Bone className="mx-auto h-3.5 w-72 max-w-full opacity-55 sm:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-4 sm:max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Bone className="mx-auto h-2 w-12 sm:mx-0" />
                  <Bone className="mx-auto h-5 w-10 sm:mx-0" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="mx-auto size-32 shrink-0 rounded-full sm:mx-0" />
        </div>
      </div>

      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 sm:p-5"
        >
          <Bone className="h-4 w-28" />
          <Bone className="mt-2 h-3 w-64 max-w-full opacity-55" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Bone className="h-8 w-20 rounded-lg" />
            <Bone className="h-8 w-20 rounded-lg" />
            <Bone className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

export function SettingsSkeleton() {
  return (
    <div
      className="imx-skeleton settings-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading settings"
    >
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <SettingsStage>
          <SettingsSkeletonBody />
        </SettingsStage>
      </AppPageFrame>
    </div>
  );
}
