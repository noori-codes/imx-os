import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  /** Dashed panel (default) matches Habits/Goals/Tasks. */
  variant?: "panel" | "plain";
  children?: ReactNode;
};

/** Shared empty surface — ink title, muted support, optional icon. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  variant = "panel",
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        variant === "panel"
          ? "rounded-2xl border border-dashed border-border/60 py-14"
          : "py-16",
        className,
      )}
    >
      {Icon ? (
        <Icon className="mb-3 size-8 text-muted-foreground" />
      ) : null}
      <h3 className="text-base font-medium text-foreground/90">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
