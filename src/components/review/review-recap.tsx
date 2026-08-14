import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  ListTodo,
  Timer,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReviewRecap } from "@/types/review";

type ReviewRecapCardProps = {
  recap: ReviewRecap;
};

export function ReviewRecapCard({ recap }: ReviewRecapCardProps) {
  const openDue = recap.tasks_due.filter((task) => !task.completed);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Today at a glance</h2>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Tasks completed"
          value={recap.tasks_completed.length}
          icon={ListTodo}
        />
        <Stat
          label="Habits"
          value={`${recap.habits_done}/${recap.habits_total}`}
          icon={CheckCircle2}
        />
        <Stat
          label="Focus minutes"
          value={recap.focus_minutes}
          icon={Timer}
        />
        <Stat
          label="Events"
          value={recap.events_count}
          icon={Calendar}
        />
      </div>

      {recap.has_journal && recap.journal_id ? (
        <Link
          href={`/notes/${recap.journal_id}`}
          className="flex items-center gap-2 rounded-lg border bg-amber-500/10 px-3 py-2 text-sm hover:bg-amber-500/15"
        >
          <BookOpen className="size-4 text-amber-600 dark:text-amber-400" />
          Open today's journal
        </Link>
      ) : (
        <Link
          href="/notes"
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/40"
        >
          <BookOpen className="size-4" />
          No journal yet — write one in Notes
        </Link>
      )}

      {recap.habits.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Habits
          </h3>
          <ul className="space-y-1.5">
            {recap.habits.map((habit) => (
              <li key={habit.id} className="flex items-center gap-2 text-sm">
                {habit.completed ? (
                  <CheckCircle2
                    className="size-4 shrink-0"
                    style={{ color: habit.color }}
                  />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    habit.completed ? "" : "text-muted-foreground",
                  )}
                >
                  {habit.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openDue.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Still due
          </h3>
          <ul className="space-y-1.5">
            {openDue.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{task.title}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/tasks"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Open tasks
          </Link>
        </section>
      ) : null}

      {recap.tasks_completed.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Completed
          </h3>
          <ul className="space-y-1.5">
            {recap.tasks_completed.slice(0, 8).map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                <span className="line-through">{task.title}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof ListTodo;
}) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
