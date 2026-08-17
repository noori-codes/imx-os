import { Header } from "@/components/layout/header";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function FocusLoading() {
  return (
    <>
      <Header title="Focus" description="One session at a time" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-6 md:px-8 md:py-8">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
          <Bone className="h-4 w-12" />
          <Bone className="h-4 w-28" />
        </div>
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-4">
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-16" />
          </div>
          <Bone className="size-52 rounded-full sm:size-56" />
          <div className="flex gap-2">
            <Bone className="h-8 w-20" />
            <Bone className="h-8 w-16" />
          </div>
        </div>
        <Bone className="h-10 w-full" />
        <div className="space-y-3 border-t border-border/60 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <Bone className="h-4 w-24" />
              <Bone className="ml-auto h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
