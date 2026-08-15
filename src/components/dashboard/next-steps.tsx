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
  show: boolean;
};

export function NextSteps({ steps, show }: NextStepsProps) {
  if (!show || steps.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight">Next up</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Suggested moves when Today is clear
        </p>
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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {step.title}
                  </span>
                  {step.detail ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {step.detail}
                    </span>
                  ) : null}
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
