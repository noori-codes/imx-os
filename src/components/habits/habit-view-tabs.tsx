import Link from "next/link";

import { cn } from "@/lib/utils";
import type { HabitView } from "@/types/habit";

type HabitViewTabsProps = {
  active: HabitView;
  activeCount: number;
  archivedCount: number;
};

export function HabitViewTabs({
  active,
  activeCount,
  archivedCount,
}: HabitViewTabsProps) {
  const tabs: { id: HabitView; label: string; count: number; href: string }[] =
    [
      {
        id: "active",
        label: "Active",
        count: activeCount,
        href: "/habits",
      },
      {
        id: "archived",
        label: "Archived",
        count: archivedCount,
        href: "/habits?view=archived",
      },
    ];

  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Habit views">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
