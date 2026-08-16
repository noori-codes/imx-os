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
    <nav
      className="flex gap-1 border-b border-border/60"
      aria-label="Habit views"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span className="ml-1.5 tabular-nums text-muted-foreground">
                {tab.count}
              </span>
            ) : null}
            {isActive ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
