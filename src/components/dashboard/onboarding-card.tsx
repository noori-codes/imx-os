import Link from "next/link";

export function OnboardingCard() {
  return (
    <section className="border-t border-border/30 pt-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Get started
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Add something small to bring today to life.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link
          href="/tasks"
          className="text-foreground underline-offset-2 hover:underline"
        >
          Add a task
        </Link>
        <Link
          href="/habits"
          className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Add a habit
        </Link>
        <Link
          href="/goals"
          className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Create a goal
        </Link>
        <Link
          href="/focus"
          className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Start focus
        </Link>
      </div>
    </section>
  );
}
