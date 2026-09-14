"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  clearRecentSearches,
  getHighlightParts,
  pushRecentSearch,
  readRecentSearches,
  SEARCH_ENTITY_META,
  SEARCH_ENTITY_ORDER,
  SEARCH_JUMP_LINKS,
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
      <div className="space-y-6">
        {recents.length > 0 ? (
          <section className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Clock3 className="size-3.5" />
                Recent
              </p>
              <button
                type="button"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {
                  clearRecentSearches();
                  setRecents([]);
                }}
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recents.map((recent) => (
                <button
                  key={recent}
                  type="button"
                  onClick={() => {
                    pushRecentSearch(recent);
                    router.push(`/search?q=${encodeURIComponent(recent)}`);
                  }}
                  className="rounded-full border border-border/55 bg-background/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {recent}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Jump to
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SEARCH_JUMP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/45 bg-background/40 px-3.5 py-3 transition-colors hover:border-border hover:bg-muted/40"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {link.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {link.hint}
                  </span>
                </span>
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>

        <EmptyState
          icon={Search}
          title="Start a search"
          description="Type at least 2 characters — or pick a recent query / jump link above."
          className="py-12"
        />
      </div>
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
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              filter === "all"
                ? "bg-foreground text-background"
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
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === type
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {SEARCH_ENTITY_META[type].plural} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {SEARCH_ENTITY_ORDER.map((type) => {
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
                    onClick={() => pushRecentSearch(query)}
                    className="search-result-card group relative flex h-full gap-3 overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-border hover:bg-card"
                  >
                    <span className="search-result-accent" aria-hidden />
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
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
      })}
    </div>
  );
}
