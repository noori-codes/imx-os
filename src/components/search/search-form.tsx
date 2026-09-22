"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pushRecentSearch, resolveSearchJump } from "@/lib/search-ui";
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
    if (!q) return;

    const jump = resolveSearchJump(q);
    if (jump) {
      startTransition(() => {
        router.push(jump.href);
      });
      return;
    }

    if (q.length < 2) return;

    pushRecentSearch(q);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  const trimmedQuery = query.trim();
  const jumpTarget = resolveSearchJump(trimmedQuery);
  const canSubmit = Boolean(jumpTarget) || trimmedQuery.length >= 2;

  if (hero) {
    return (
      <form onSubmit={onSubmit} className={cn("relative", className)}>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground sm:left-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or jump — tasks, goals, habits…"
          className="search-hero-input h-12 w-full rounded-xl border border-surface-border bg-surface pr-28 pl-11 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/65 focus:border-foreground/20 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:h-14 sm:pl-12 sm:text-[1.05rem]"
          autoFocus={autoFocus}
          name="q"
          aria-label="Search"
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1 sm:right-2">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <Button
            type="submit"
            className="h-10 rounded-xl px-4 sm:px-5"
            disabled={!canSubmit || pending}
          >
            {pending ? "…" : jumpTarget ? "Go" : "Search"}
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
            compact ? "Search…" : "Search or jump to tasks, goals…"
          }
          className={cn(
            "h-11 w-full rounded-xl border border-surface-border bg-surface pl-10 text-sm outline-none focus:border-foreground/20",
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
          disabled={!canSubmit || pending}
        >
          {pending ? "…" : jumpTarget ? "Go" : "Search"}
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          variant="outline"
          disabled={!canSubmit || pending}
          aria-label={jumpTarget ? "Go" : "Search"}
        >
          <Search className="size-4" />
        </Button>
      )}
    </form>
  );
}
