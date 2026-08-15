import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Target,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/dashboard";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  variant?: "default" | "warning" | "success";
};

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  variant = "default",
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg bg-muted/70",
            variant === "warning" && "bg-destructive/10",
            variant === "success" && "bg-primary/10",
          )}
        >
          <Icon
            className={cn(
              "size-3.5 text-muted-foreground",
              variant === "warning" && "text-destructive",
              variant === "success" && "text-primary",
            )}
          />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </>
  );

  const className = cn(
    "rounded-2xl border bg-card p-4 shadow-sm transition-colors",
    href && "hover:bg-accent/30",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

type StatGridProps = {
  stats: DashboardStats;
};

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Active tasks"
        value={stats.active_tasks}
        icon={ListTodo}
        href="/tasks"
      />
      <StatCard
        label="Due today"
        value={stats.due_today}
        icon={Calendar}
        variant={stats.due_today > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={AlertCircle}
        variant={stats.overdue > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Completed"
        value={stats.completed_tasks}
        icon={CheckCircle2}
        variant="success"
      />
      <StatCard
        label="Goals"
        value={stats.goals}
        icon={Target}
        href="/goals"
      />
      <StatCard
        label="Projects"
        value={stats.projects}
        icon={FolderKanban}
        href="/goals"
      />
    </div>
  );
}
