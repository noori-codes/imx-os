import Link from "next/link";
import { Plus, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OnboardingCard() {
  return (
    <section className="imx-panel flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-sm font-medium">Get started</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
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
