import Link from "next/link";
import { ListTodo, Plus, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Quick actions</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/tasks">
            <Plus className="size-4" />
            Add task
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/goals">
            <Target className="size-4" />
            New goal
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/tasks">
            <ListTodo className="size-4" />
            All tasks
          </Link>
        </Button>
      </div>
    </div>
  );
}
