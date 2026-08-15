import Link from "next/link";
import { Plus, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OnboardingCard() {
  return (
    <section className="rounded-2xl border border-dashed border-border/80 px-5 py-8 text-center">
      <h2 className="text-base font-semibold tracking-tight">
        Start your personal OS
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add one task and one goal. The dashboard will fill in as you work —
        habits, focus, and reviews build on top.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button asChild size="sm">
          <Link href="/tasks">
            <Plus className="size-3.5" />
            Add a task
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/goals">
            <Target className="size-3.5" />
            Create a goal
          </Link>
        </Button>
      </div>
    </section>
  );
}
