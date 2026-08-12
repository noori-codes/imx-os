import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NoteNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Note not found</h2>
      <p className="text-sm text-muted-foreground">
        This note may have been deleted or you don&apos;t have access.
      </p>
      <Button asChild>
        <Link href="/notes">Back to notes</Link>
      </Button>
    </div>
  );
}
