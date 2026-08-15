import Link from "next/link";
import { Plus, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OnboardingCard() {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 border-y border-border/60 py-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Get started</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Add a task or goal to bring the dashboard to life.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <Link href="/tasks">
            <Plus className="size-3.5" />
            Task
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/goals">
            <Target className="size-3.5" />
            Goal
          </Link>
        </Button>
      </div>
    </section>
  );
}
