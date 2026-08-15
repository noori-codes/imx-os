import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  ListTodo,
  Target,
  type LucideIcon,
} from "lucide-react";

import type { SearchEntityType, SearchResult } from "@/types/search";

const ENTITY_META: Record<
  SearchEntityType,
  { label: string; icon: LucideIcon }
> = {
  task: { label: "Task", icon: ListTodo },
  goal: { label: "Goal", icon: Target },
  project: { label: "Project", icon: FolderKanban },
  note: { label: "Note", icon: FileText },
  habit: { label: "Habit", icon: CheckSquare },
  event: { label: "Event", icon: Calendar },
};

type SearchResultsProps = {
  query: string;
  results: SearchResult[];
};

export function SearchResults({ query, results }: SearchResultsProps) {
  if (query.length < 2) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Type at least 2 characters to search across tasks, notes, goals,
          projects, habits, and events.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No results for <span className="font-medium text-foreground">“{query}”</span>
        </p>
      </div>
    );
  }

  const grouped = results.reduce(
    (acc, result) => {
      const list = acc[result.entity_type] ?? [];
      list.push(result);
      acc[result.entity_type] = list;
      return acc;
    },
    {} as Partial<Record<SearchEntityType, SearchResult[]>>,
  );

  const order: SearchEntityType[] = [
    "task",
    "goal",
    "project",
    "note",
    "habit",
    "event",
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {results.length} result{results.length === 1 ? "" : "s"} for{" "}
        <span className="font-medium text-foreground">“{query}”</span>
      </p>

      {order.map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;
        const meta = ENTITY_META[type];
        const Icon = meta.icon;

        return (
          <section key={type}>
            <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5" />
              {meta.label}s · {items.length}
            </h2>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={`${item.entity_type}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-accent/30"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
