"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Plus,
  Target,
} from "lucide-react";

import { createNote } from "@/actions/notes";

const CREATE_ACTIONS = [
  {
    id: "task",
    label: "Add task",
    href: "/tasks?compose=1",
    icon: Plus,
  },
  {
    id: "event",
    label: "Add event",
    href: "/calendar?compose=1",
    icon: Calendar,
  },
  {
    id: "habit",
    label: "Add habit",
    href: "/habits?compose=1",
    icon: CheckSquare,
  },
  {
    id: "goal",
    label: "Add goal",
    href: "/goals?compose=1",
    icon: Target,
  },
  {
    id: "book",
    label: "Add book",
    href: "/books?compose=1",
    icon: BookOpen,
  },
] as const;

/**
 * Empty-query create strip on /search — parity with ⌘K Actions.
 */
export function SearchQuickCreate() {
  const [, startTransition] = useTransition();

  return (
    <section className="mx-auto w-full max-w-3xl rounded-[1.35rem] imx-surface px-5 py-5 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Create
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Same actions as the command palette — no query needed.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {CREATE_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className={
                action.id === "task"
                  ? "inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  : "inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
              }
            >
              <Icon className="size-3.5" />
              {action.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              void createNote("note");
            });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
        >
          New note
        </button>
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              void createNote("journal");
            });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
        >
          Today’s journal
        </button>
      </div>
    </section>
  );
}
