"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openImxCapture } from "@/lib/imx-events";
import { cn } from "@/lib/utils";

/** Header trigger — opens the universal Quick Capture dialog. */
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
        "size-9 shrink-0 border-surface-border bg-surface",
        className,
      )}
      aria-label="Quick capture (C)"
      onClick={() => openImxCapture()}
    >
      <Plus className="size-4" />
    </Button>
  );
}
