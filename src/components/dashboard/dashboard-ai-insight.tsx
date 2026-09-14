"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import {
  generateWeeklyInsight,
  type WeeklyInsight,
} from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatRetry(ms: number) {
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours <= 1) return "about an hour";
  return `about ${hours} hours`;
}

export function DashboardAiInsight() {
  const [pending, startTransition] = useTransition();
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateWeeklyInsight();
      if (!result.ok) {
        const suffix =
          result.code === "cooldown" && result.retryAfterMs
            ? ` Try again in ${formatRetry(result.retryAfterMs)}.`
            : "";
        setError(`${result.error}${suffix}`);
        return;
      }
      setInsight(result.insight);
      setGeneratedAt(result.generatedAt);
    });
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/40 bg-background/40 px-4 py-4 sm:px-5",
      )}
      aria-label="Weekly AI insight"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Weekly insight
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            A short read of your last 7 days — focus, habits, tasks, and reviews.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={handleGenerate}
          className="shrink-0 gap-1.5 rounded-full"
        >
          <Sparkles className="size-3.5" />
          {pending ? "Thinking…" : insight ? "Refresh" : "Get insight"}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {insight ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-foreground">
            {insight.summary}
          </p>
          {insight.suggestions.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {insight.suggestions.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {generatedAt ? (
            <p className="text-[11px] tabular-nums text-muted-foreground/70">
              Generated{" "}
              {new Date(generatedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
