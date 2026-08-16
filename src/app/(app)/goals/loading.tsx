import { Header } from "@/components/layout/header";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function GoalsLoading() {
  return (
    <>
      <Header
        title="Goals"
        description="Outcomes broken into projects and tasks"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Bone className="h-10 w-full" />
        <div className="space-y-4 border-t border-border/60 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 border-b border-border/40 pb-4">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-72 max-w-full opacity-60" />
              <Bone className="h-1 w-40" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
