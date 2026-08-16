import Link from "next/link";
import {
  CheckSquare,
  ListTodo,
  Moon,
  Target,
  Timer,
  ArrowUpRight,
} from "lucide-react";

import type { NextStep } from "@/types/dashboard";

const ICONS = {
  task: ListTodo,
  habit: CheckSquare,
  review: Moon,
  focus: Timer,
  setup: Target,
} as const;

type NextStepsProps = {
  steps: NextStep[];
  show?: boolean;
};

export function NextSteps({ steps, show = true }: NextStepsProps) {
  if (!show || steps.length === 0) return null;

  return (
    <section className="border-t border-border/60 pt-8">
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight">Next up</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Suggested moves</p>
      </div>

      <ul className="divide-y divide-border/60 border-y border-border/60">
        {steps.map((step) => {
          const Icon = ICONS[step.kind];
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/30"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {step.title}
                </span>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
