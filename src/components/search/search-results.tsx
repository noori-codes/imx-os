import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  ListTodo,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
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
  book: { label: "Book", icon: BookOpen },
};

type SearchResultsProps = {
  query: string;
  results: SearchResult[];
};

export function SearchResults({ query, results }: SearchResultsProps) {
  if (query.length < 2) {
    return (
      <EmptyState
        icon={Search}
        title="Start a search"
        description="Type at least 2 characters to look across tasks, notes, goals, projects, habits, events, and books."
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No matches"
        description={`Nothing matched “${query}”. Try another word or check spelling.`}
      />
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
    "book",
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
          <section
            key={type}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card/80"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-border/40 px-4 py-3">
              <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="size-3.5 opacity-80" />
                {meta.label}s
              </h2>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
            <ul>
              {items.map((item, index) => (
                <li
                  key={`${item.entity_type}-${item.id}`}
                  className="search-result-row"
                  style={{ ["--i" as string]: index }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 border-b border-border/40 px-4 py-3 transition-colors last:border-b-0",
                      "hover:bg-muted/40",
                    )}
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      {item.subtitle ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      ) : null}
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
