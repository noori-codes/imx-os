"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type EntityHeaderProps = {
  title: string;
  description: string | null;
  meta?: string;
  progress?: number | null;
  onSave: (input: {
    title: string;
    description: string | null;
  }) => Promise<{ error?: string }>;
};

export function EntityHeader({
  title,
  description,
  meta,
  progress,
  onSave,
}: EntityHeaderProps) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-3 border-b border-border/60 pb-6">
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
        />
        <Textarea
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="resize-none"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={save}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="group border-b border-border/60 pb-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {meta ? (
            <p className="mt-3 text-xs text-muted-foreground">{meta}</p>
          ) : null}
          {progress != null && progress >= 0 ? (
            <div className="mt-3 h-1 max-w-sm overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/80 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
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
  );
}
