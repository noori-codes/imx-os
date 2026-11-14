"use client";

import Link from "next/link";
import {
  CheckSquare,
  ListTodo,
  Moon,
  NotebookPen,
  Timer,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardQuickActionsProps = {
  hasTodayReview: boolean;
  habitsOpen: number;
  dueOpen: number;
};

const actions = [
  { id: "focus", href: "/focus", label: "Focus", icon: Timer },
  { id: "task", href: "/tasks?compose=1", label: "Task", icon: ListTodo },
  { id: "habit", href: "/habits", label: "Habits", icon: CheckSquare },
  { id: "note", href: "/notes", label: "Note", icon: NotebookPen },
  { id: "review", href: "/review", label: "Review", icon: Moon },
] as const;

/** Quiet jump rail — one active cue, no chip cloud. */
export function DashboardQuickActions({
  hasTodayReview,
  habitsOpen,
  dueOpen,
}: DashboardQuickActionsProps) {
  const spotlight =
    dueOpen > 0
      ? "task"
      : habitsOpen > 0
        ? "habit"
        : !hasTodayReview
          ? "review"
          : "focus";

  return (
    <nav aria-label="Quick actions" className="dash-jump">
      {actions.map((action) => {
        const Icon = action.icon;
        const active = action.id === spotlight;

        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn("dash-jump-item", active && "dash-jump-item-active")}
          >
            <Icon className="size-3.5 opacity-75" strokeWidth={1.9} />
            {action.label}
          </Link>
        );
      })}
    </nav>
  );
}
