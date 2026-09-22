"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { askCoachQuestion, type CoachReply } from "@/actions/ai";
import { coachActionLabel, type CoachActionHref } from "@/lib/ai/coach-actions";
import { startOfWeek, toDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

function weekInsightKey(date = new Date()) {
  return `imx-week-insight:${toDateString(startOfWeek(date))}`;
}

type CachedInsight = {
  summary: string;
  suggestions: CoachReply["suggestions"];
  generatedAt: string;
};

function readCache(): CachedInsight | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(weekInsightKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedInsight;
    if (!parsed?.summary) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(value: CachedInsight) {
  try {
    window.localStorage.setItem(weekInsightKey(), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Coach paragraph for the current week — cached locally per week start. */
export function WeeklyInsight({ className }: { className?: string }) {
  const [insight, setInsight] = useState<CachedInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInsight(readCache());
    setHydrated(true);
  }, []);

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await askCoachQuestion("week_overview");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next: CachedInsight = {
        summary: result.reply.summary,
        suggestions: result.reply.suggestions,
        generatedAt: result.generatedAt,
      };
      writeCache(next);
      setInsight(next);
    });
  }

  if (!hydrated) {
    return (
      <div
        className={cn(
          "rounded-[1.35rem] border border-border/40 bg-foreground/[0.02] px-5 py-4",
          className,
        )}
      >
        <div className="h-3 w-24 rounded bg-muted/60" aria-hidden />
        <div className="mt-3 h-12 w-full rounded bg-muted/40" aria-hidden />
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] imx-surface imx-surface-rim px-5 py-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="size-3.5 opacity-70" aria-hidden />
            Weekly insight
          </p>
          {insight ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {insight.summary}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              A short coach read of the last seven days — private, just for you.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={generate}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Reading…
            </>
          ) : insight ? (
            "Refresh"
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {insight && insight.suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {insight.suggestions.map((item, index) =>
            item.href ? (
              <Link
                key={`${item.text}-${index}`}
                href={item.href}
                className="inline-flex items-center rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-opacity hover:opacity-90 dark:bg-foreground/14 dark:text-foreground dark:ring-1 dark:ring-foreground/20"
              >
                {coachActionLabel(item.href as CoachActionHref)}
              </Link>
            ) : (
              <span
                key={`${item.text}-${index}`}
                className="inline-flex items-center rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {item.text}
              </span>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}
