"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Flame,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteHabit,
  setHabitArchived,
  toggleHabitToday,
  updateHabit,
} from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { HABIT_COLORS, type HabitWithStats } from "@/types/habit";

type HabitItemProps = {
  habit: HabitWithStats;
  index?: number;
  archivedView?: boolean;
  onOptimisticRemove: (id: string) => void;
  onOptimisticToggle?: (id: string, completed: boolean) => void;
};

function weekdayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "narrow",
  });
}

export function HabitItem({
  habit,
  index = 0,
  archivedView = false,
  onOptimisticRemove,
  onOptimisticToggle,
}: HabitItemProps) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description ?? "");
  const [color, setColor] = useState(habit.color);
  const [error, setError] = useState<string | null>(null);

  const optimistic = habit;

  function onToggle() {
    if (archivedView) return;
    const next = !optimistic.completed_today;
    startTransition(async () => {
      onOptimisticToggle?.(optimistic.id, next);
      await toggleHabitToday(optimistic.id, next);
    });
  }

  function handleArchive() {
    startTransition(async () => {
      onOptimisticRemove(optimistic.id);
      await setHabitArchived(optimistic.id, true);
    });
  }

  function handleRestore() {
    startTransition(async () => {
      onOptimisticRemove(optimistic.id);
      await setHabitArchived(optimistic.id, false);
    });
  }

  function handleDelete() {
    void (async () => {
      const ok = await confirm({
        title: `Delete “${optimistic.title}”?`,
        description: "This removes the habit and all of its check-in history.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      startTransition(async () => {
        onOptimisticRemove(optimistic.id);
        await deleteHabit(optimistic.id);
      });
    })();
  }

  function saveEdit() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Title is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateHabit(optimistic.id, {
        title: nextTitle,
        description: description.trim() || null,
        color,
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
      <li
        className="habits-card rounded-2xl border border-border/50 bg-card/80 p-4"
        style={{ ["--i" as string]: index }}
      >
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            aria-label="Habit title"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                title={swatch.label}
                onClick={() => setColor(swatch.value)}
                className={cn(
                  "size-7 rounded-full ring-offset-background transition",
                  color === swatch.value &&
                    "ring-2 ring-foreground ring-offset-2",
                )}
                style={{ backgroundColor: swatch.value }}
                aria-label={swatch.label}
                aria-pressed={color === swatch.value}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveEdit}>
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
      </li>
    );
  }

  return (
    <li
      className={cn(
        "habits-card group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-border",
        optimistic.completed_today && !archivedView && "habits-card-done",
      )}
      style={{ ["--i" as string]: index }}
    >
      <div
        className="habits-card-accent absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: optimistic.color }}
        aria-hidden
      />

      <div className="flex items-start gap-3 pl-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggle}
          disabled={archivedView}
          className={cn(
            "mt-0.5 size-10 shrink-0 rounded-full border-2 transition-all duration-150",
            optimistic.completed_today && "text-white shadow-sm",
            archivedView && "opacity-50",
          )}
          style={
            optimistic.completed_today
              ? {
                  backgroundColor: optimistic.color,
                  borderColor: optimistic.color,
                }
              : { borderColor: optimistic.color }
          }
          aria-label={
            optimistic.completed_today
              ? "Undo today's check-in"
              : "Mark done for today"
          }
          aria-pressed={optimistic.completed_today}
        >
          <span
            className={cn(
              "text-sm font-bold transition-all duration-150",
              optimistic.completed_today
                ? "scale-100 opacity-100"
                : "scale-50 opacity-0",
            )}
          >
            ✓
          </span>
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold leading-snug tracking-tight",
                  optimistic.completed_today &&
                    !archivedView &&
                    "text-muted-foreground line-through",
                )}
              >
                {optimistic.title}
              </p>
              {optimistic.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {optimistic.description}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              {!archivedView ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    onClick={() => {
                      setTitle(optimistic.title);
                      setDescription(optimistic.description ?? "");
                      setColor(optimistic.color);
                      setError(null);
                      setEditing(true);
                    }}
                    aria-label="Edit habit"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    onClick={handleArchive}
                    aria-label="Archive habit"
                  >
                    <Archive className="size-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={handleRestore}
                  aria-label="Restore habit"
                >
                  <ArchiveRestore className="size-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                aria-label="Delete habit"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1 tabular-nums",
                optimistic.current_streak > 0 &&
                  "font-medium text-amber-700 dark:text-amber-300",
              )}
            >
              <Flame
                className={cn(
                  "size-3",
                  optimistic.current_streak > 0 && "fill-current",
                )}
              />
              {optimistic.current_streak}d streak
            </span>
            <span className="tabular-nums">
              Best {optimistic.longest_streak}d
            </span>
          </div>

          <div className="mt-3 flex gap-1.5">
            {optimistic.week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                  {weekdayLabel(day.date)}
                </span>
                <div
                  className={cn(
                    "h-2 w-full rounded-full transition-colors",
                    !day.completed && "bg-muted",
                  )}
                  style={
                    day.completed
                      ? { backgroundColor: optimistic.color }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
