import { NotesPageFrame } from "@/components/notes/notes-page-frame";

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
      <NotesPageFrame>
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
              <Bone className="h-3 w-16" />
              <Bone className="mt-3 h-5 w-28" />
              <Bone className="mt-3 h-4 w-48 max-w-full" />
            </section>
            <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
              <Bone className="h-3 w-16" />
              <Bone className="mt-3 h-5 w-36" />
              <Bone className="mt-3 h-4 w-52 max-w-full" />
            </section>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-5 w-40" />
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <Bone className="h-22 rounded-2xl" />
              <Bone className="h-22 rounded-2xl" />
              <Bone className="h-22 rounded-2xl" />
            </div>
          </section>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <section className="rounded-[1.75rem] border border-border/60 bg-card px-5 py-6 sm:px-6">
            <Bone className="h-3 w-16" />
            <Bone className="mt-3 h-5 w-32" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-1">
                  <Bone className="size-10 rounded-2xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Bone className="h-4 w-40" />
                    <Bone className="h-3 w-64 max-w-full" />
                    <Bone className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </NotesPageFrame>
    </div>
  );
}
