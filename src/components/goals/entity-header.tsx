"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EntityHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string | null;
  meta?: string;
  progress?: number | null;
  sealed?: boolean;
  onSave: (input: {
    title: string;
    description: string | null;
  }) => Promise<{ error?: string }>;
};

export function EntityHeader({
  eyebrow = "Entity",
  title,
  description,
  meta,
  progress,
  sealed = false,
  onSave,
}: EntityHeaderProps) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);

  const ringValue = progress != null && progress >= 0 ? progress : 0;
  const hasProgress = progress != null && progress >= 0;

  function startEdit() {
    setDraftTitle(title);
    setDraftDescription(description ?? "");
    setError(null);
    setEditing(true);
  }

  function save() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setError("Title is required.");
      return;
    }
    startTransition(async () => {
      const result = await onSave({
        title: nextTitle,
        description: draftDescription.trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setError(null);
    });
  }

  if (editing) {
    return (
      <div className="relative overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80 p-5 sm:p-6">
        <div className="goals-composer-glow" aria-hidden />
        <div className="relative z-1 space-y-3">
          <Input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-11 text-lg font-semibold"
            autoFocus
            aria-label="Title"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "entity-header-error" : undefined}
            disabled={pending}
          />
          <Textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="resize-none"
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={pending}
              aria-label="Cancel edit"
            >
              <X className="size-4" />
            </Button>
          </div>
          {error ? (
            <p
              id="entity-header-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "goals-pulse group relative overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/80 px-5 py-5 sm:px-7 sm:py-6",
        sealed && "goals-pulse-sealed",
      )}
    >
      <div className="goals-pulse-vignette" aria-hidden />
      <div className="goals-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
              {meta ? (
                <p className="mt-3 text-xs text-muted-foreground">{meta}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
              onClick={startEdit}
              aria-label="Edit"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        </div>

        <ProgressRing
          value={ringValue}
          size={112}
          stroke={6}
          sealed={sealed || (hasProgress && ringValue >= 100)}
          featured
          className="mx-auto sm:mx-0"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {hasProgress ? `${ringValue}%` : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {sealed || (hasProgress && ringValue >= 100)
                ? "sealed"
                : hasProgress
                  ? "done"
                  : "seed"}
            </p>
          </div>
        </ProgressRing>
      </div>
    </div>
  );
}
