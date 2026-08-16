import { Header } from "@/components/layout/header";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function HabitsLoading() {
  return (
    <>
      <Header title="Habits" description="Daily check-ins and streaks" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <div className="flex gap-4 border-b border-border/60 pb-2">
          <Bone className="h-4 w-14" />
          <Bone className="h-4 w-16" />
        </div>
        <Bone className="h-10 w-full" />
        <div className="space-y-4 border-t border-border/60 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-border/40 pb-4">
              <Bone className="size-8 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-24 opacity-60" />
                <Bone className="h-1.5 w-full max-w-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
