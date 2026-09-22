"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, Search, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  clearRecentSearches,
  getHighlightParts,
  pushRecentSearch,
  readRecentSearches,
  SEARCH_ENTITY_META,
  SEARCH_ENTITY_ORDER,
  parseSearchEntityType,
} from "@/lib/search-ui";
import { cn } from "@/lib/utils";
import type { SearchEntityType, SearchResult } from "@/types/search";

type SearchResultsProps = {
  query: string;
  results: SearchResult[];
  initialType?: string;
};

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightParts(text, query).map((part) =>
        part.type === "mark" ? (
          <mark key={part.key} className="search-hit">
            {part.value}
          </mark>
        ) : (
          <span key={part.key}>{part.value}</span>
        ),
      )}
    </>
  );
}

export function SearchResults({
  query,
  results,
  initialType,
}: SearchResultsProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<SearchEntityType | "all">(
    parseSearchEntityType(initialType),
  );
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setRecents(readRecentSearches());
  }, []);

  useEffect(() => {
    setFilter(parseSearchEntityType(initialType));
  }, [initialType]);

  const counts = useMemo(() => {
    const map = {} as Partial<Record<SearchEntityType, number>>;
    for (const item of results) {
      map[item.entity_type] = (map[item.entity_type] ?? 0) + 1;
    }
    return map;
  }, [results]);

  const filtered = useMemo(() => {
    if (filter === "all") return results;
    return results.filter((item) => item.entity_type === filter);
  }, [results, filter]);

  const grouped = useMemo(() => {
    const map = {} as Partial<Record<SearchEntityType, SearchResult[]>>;
    for (const item of filtered) {
      const list = map[item.entity_type] ?? [];
      list.push(item);
      map[item.entity_type] = list;
    }
    return map;
  }, [filtered]);

  if (query.length < 2) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <section className="search-spotlight relative overflow-hidden rounded-[1.5rem] imx-surface p-5 sm:p-6">
          <div className="search-spotlight-glow" aria-hidden="true" />
          <div className="relative z-[1]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {recents.length > 0 ? (
                    <>
                      <Clock3 className="size-3.5" />
                      Recent threads
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Ready when you are
                    </>
                  )}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {recents.length > 0
                    ? "Pick up where you left off — or type a new query above."
                    : "Type two letters to search, or jump to Tasks, Goals, Habits."}
                </p>
              </div>
              {recents.length > 0 ? (
                <button
                  type="button"
                  className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    clearRecentSearches();
                    setRecents([]);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>

            {recents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recents.map((recent, index) => (
                  <button
                    key={recent}
                    type="button"
                    style={{ ["--i" as string]: index }}
                    onClick={() => {
                      pushRecentSearch(recent);
                      router.push(`/search?q=${encodeURIComponent(recent)}`);
                    }}
                    className="search-recent-chip rounded-xl border border-surface-border bg-surface px-3.5 py-1.5 text-sm text-foreground/85 transition-colors hover:border-foreground/20 hover:bg-background hover:text-foreground"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <EmptyState
                  icon={Search}
                  title="Start a search"
                  description="Your recent queries will live here."
                  variant="plain"
                  className="py-6"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Link
                    href="/tasks?compose=1"
                    className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Add task
                  </Link>
                  <Link
                    href="/calendar?compose=1"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                  >
                    Add event
                  </Link>
                  <Link
                    href="/habits?compose=1"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                  >
                    Add habit
                  </Link>
                  <Link
                    href="/goals?compose=1"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                  >
                    Add goal
                  </Link>
                  <Link
                    href="/books?compose=1"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                  >
                    Add book
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <EmptyState
          icon={Search}
          title="No matches"
          description={`Nothing matched “${query}”. Try another word, or jump to a space.`}
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/tasks?compose=1"
              className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Add task
            </Link>
            <Link
              href="/calendar?compose=1"
              className="inline-flex h-10 items-center rounded-xl border border-surface-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
            >
              Add event
            </Link>
            <Link
              href="/habits?compose=1"
              className="inline-flex h-10 items-center rounded-xl border border-surface-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
            >
              Add habit
            </Link>
            <Link
              href="/goals?compose=1"
              className="inline-flex h-10 items-center rounded-xl border border-surface-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
            >
              Add goal
            </Link>
            <Link
              href="/books?compose=1"
              className="inline-flex h-10 items-center rounded-xl border border-surface-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
            >
              Add book
            </Link>
          </div>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span>
          {filtered.length === 1 ? " result" : " results"}
          {filter !== "all" ? (
            <>
              {" "}
              in {SEARCH_ENTITY_META[filter].plural.toLowerCase()}
            </>
          ) : null}{" "}
          for <span className="font-medium text-foreground">“{query}”</span>
        </p>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
              filter === "all"
                ? "bg-foreground text-background dark:bg-foreground/12 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
                : "bg-muted/60 text-muted-foreground hover:text-foreground",
            )}
          >
            All · {results.length}
          </button>
          {SEARCH_ENTITY_ORDER.map((type) => {
            const count = counts[type] ?? 0;
            if (!count) return null;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === type
                    ? "bg-foreground text-background dark:bg-foreground/12 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {SEARCH_ENTITY_META[type].plural} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && filter !== "all" ? (
        <EmptyState
          icon={Search}
          title={`No ${SEARCH_ENTITY_META[filter].plural.toLowerCase()} here`}
          description="Other types still matched — clear the type chip to see them."
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Show all · {results.length}
          </button>
        </EmptyState>
      ) : (
        SEARCH_ENTITY_ORDER.map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;
        const meta = SEARCH_ENTITY_META[type];
        const Icon = meta.icon;

        return (
          <section key={type} className="search-result-group">
            <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
              <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="size-3.5 opacity-80" />
                {meta.plural}
              </h2>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((item, index) => (
                <li
                  key={`${item.entity_type}-${item.id}`}
                  className="search-result-row"
                  style={{ ["--i" as string]: index }}
                >
                  <Link
                    href={item.href}
                    data-entity={item.entity_type}
                    onClick={() => pushRecentSearch(query)}
                    className="search-result-card group relative flex h-full gap-3 overflow-hidden rounded-2xl imx-surface p-4 transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-border hover:bg-surface-strong hover:shadow-sm"
                  >
                    <span className="search-result-accent" aria-hidden />
                    <div className="search-result-icon flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/60 text-muted-foreground transition-colors group-hover:border-border group-hover:text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                        <Highlighted text={item.title} query={query} />
                      </p>
                      {item.subtitle ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.subtitle}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                        {meta.label}
                      </p>
                    </div>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })
      )}
    </div>
  );
}
