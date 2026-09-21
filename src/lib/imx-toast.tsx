"use client";

import Link from "next/link";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type ImxToastTone = "default" | "success" | "error";

function ToastCard({
  title,
  description,
  tone = "default",
  toastId,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  tone?: ImxToastTone;
  toastId: string | number;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl",
        "bg-background/92 dark:bg-card/92",
        tone === "success" && "border-foreground/20",
        tone === "error" && "border-destructive/30",
        tone === "default" && "border-border/55",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-tight text-foreground">
            {title}
          </p>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              onClick={() => toast.dismiss(toastId)}
              className="mt-2 inline-flex text-xs font-medium text-foreground underline-offset-2 hover:underline"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(toastId)}
          className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Dismiss"
        >
          <span className="text-sm leading-none">×</span>
        </button>
      </div>
    </div>
  );
}

export function imxToast(
  title: string,
  options?: {
    description?: string;
    tone?: ImxToastTone;
    actionHref?: string;
    actionLabel?: string;
  },
) {
  toast.custom(
    (id) => (
      <ToastCard
        toastId={id}
        title={title}
        description={options?.description}
        tone={options?.tone}
        actionHref={options?.actionHref}
        actionLabel={options?.actionLabel}
      />
    ),
    { duration: options?.tone === "error" ? 5200 : 3800 },
  );
}
