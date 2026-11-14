"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openImxCapture } from "@/lib/imx-events";
import { cn } from "@/lib/utils";

/** Header trigger — opens Quick Capture (C). */
export function QuickCaptureTrigger({
  className,
}: {
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "size-8 shrink-0 rounded-md border-border/60 bg-background",
        className,
      )}
      aria-label="Quick capture (C)"
      onClick={() => openImxCapture()}
    >
      <Plus className="size-4" />
    </Button>
  );
}
