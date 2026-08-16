import { Header } from "@/components/layout/header";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function TasksLoading() {
  return (
    <>
      <Header title="Tasks" description="Capture, schedule, and finish" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <div className="flex gap-4 border-b border-border/60 pb-2">
          <Bone className="h-4 w-12" />
          <Bone className="h-4 w-12" />
          <Bone className="h-4 w-16" />
          <Bone className="h-4 w-8" />
        </div>
        <Bone className="h-10 w-full" />
        <div className="space-y-3 border-t border-border/60 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <Bone className="size-5 rounded-full" />
              <Bone className="h-4 flex-1" />
              <Bone className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
