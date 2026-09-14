"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pushRecentSearch } from "@/lib/search-ui";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  initialQuery?: string;
  autoFocus?: boolean;
  compact?: boolean;
  className?: string;
  /** Large hero search field on /search */
  hero?: boolean;
};

export function SearchForm({
  initialQuery = "",
  autoFocus = false,
  compact = false,
  className,
  hero = false,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    pushRecentSearch(q);

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  if (hero) {
    return (
      <form onSubmit={onSubmit} className={cn("relative", className)}>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground sm:left-5 sm:size-5" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks, notes, goals, books…"
          className="search-hero-input h-14 w-full rounded-2xl border border-border/55 bg-background/70 pr-28 pl-12 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/65 focus:border-foreground/25 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_6%,transparent)] sm:h-16 sm:pl-14 sm:text-lg"
          autoFocus={autoFocus}
          name="q"
          aria-label="Search"
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 sm:right-3">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <Button
            type="submit"
            className="h-10 rounded-xl px-4 sm:h-11 sm:px-5"
            disabled={query.trim().length < 2 || pending}
          >
            {pending ? "…" : "Search"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex items-center gap-2", className)}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            compact ? "Search…" : "Search tasks, notes, goals, books…"
          }
          className={cn(
            "h-11 w-full rounded-xl border border-border/50 bg-background/60 pl-10 text-sm outline-none focus:border-foreground/20",
            compact && "h-9 pl-9",
          )}
          autoFocus={autoFocus}
          name="q"
          aria-label="Search"
        />
      </div>
      {!compact ? (
        <Button
          type="submit"
          className="h-11 rounded-xl px-5"
          disabled={query.trim().length < 2 || pending}
        >
          {pending ? "Searching…" : "Search"}
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          variant="outline"
          disabled={query.trim().length < 2 || pending}
          aria-label="Search"
        >
          <Search className="size-4" />
        </Button>
      )}
    </form>
  );
}
