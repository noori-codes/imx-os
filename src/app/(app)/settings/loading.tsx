import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function SettingsSkeletonBody() {
  return (
    <div className="settings-stage-content flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-8 w-36 sm:h-9" />
        <Bone className="h-3.5 w-80 max-w-full opacity-55" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <Bone className="h-2.5 w-14" />
            <Bone className="mt-2 h-7 w-16" />
            <Bone className="mt-2 h-2.5 w-20 opacity-55" />
          </div>
        ))}
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5"
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
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <>
      <Header title="Settings" />
      <div
        className="imx-skeleton settings-skeleton"
        role="status"
        aria-live="polite"
        aria-label="Loading settings"
      >
        <AppPageFrame className="max-w-5xl gap-8 md:py-8">
          <SettingsSkeletonBody />
        </AppPageFrame>
      </div>
    </>
  );
}
