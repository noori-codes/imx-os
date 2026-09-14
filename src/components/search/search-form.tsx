"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  initialQuery?: string;
  autoFocus?: boolean;
  compact?: boolean;
  className?: string;
};

export function SearchForm({
  initialQuery = "",
  autoFocus = false,
  compact = false,
  className,
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

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex items-center gap-2", className)}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            compact ? "Search…" : "Search tasks, notes, goals, books…"
          }
          className={cn(
            "h-11 border-border/50 bg-background/60 pl-10",
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
