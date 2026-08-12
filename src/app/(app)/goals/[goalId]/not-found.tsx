import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GoalNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Goal not found</h2>
      <p className="text-sm text-muted-foreground">
        This goal may have been deleted or you don&apos;t have access.
      </p>
      <Button asChild>
        <Link href="/goals">Back to goals</Link>
      </Button>
    </div>
  );
}
