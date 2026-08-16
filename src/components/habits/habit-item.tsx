"use client";

import { useOptimistic, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { HABIT_COLORS, type HabitWithStats } from "@/types/habit";

type HabitItemProps = {
  habit: HabitWithStats;
  archivedView?: boolean;
  onOptimisticRemove: (id: string) => void;
};

export function HabitItem({
  habit,
  archivedView = false,
  onOptimisticRemove,
}: HabitItemProps) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description ?? "");
  const [color, setColor] = useState(habit.color);
  const [error, setError] = useState<string | null>(null);

  const [optimistic, setOptimistic] = useOptimistic(
    habit,
    (state, completed: boolean) => {
      const today = toDateString(new Date());
      let current_streak = state.current_streak;

      if (!state.completed_today && completed) current_streak += 1;
      if (state.completed_today && !completed) {
        current_streak = Math.max(0, current_streak - 1);
      }

      return {
        ...state,
        completed_today: completed,
        current_streak,
        longest_streak: Math.max(state.longest_streak, current_streak),
        week: state.week.map((day) =>
          day.date === today ? { ...day, completed } : day,
        ),
      };
    },
  );

  function onToggle() {
    if (archivedView) return;
    const next = !optimistic.completed_today;
    startTransition(async () => {
      setOptimistic(next);
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
    if (
      !window.confirm(
        `Delete “${optimistic.title}”?\n\nThis removes the habit and all of its check-in history.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      onOptimisticRemove(optimistic.id);
      await deleteHabit(optimistic.id);
    });
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
      <li className="border-b border-border/50 py-4">
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
        "group border-b border-border/50 py-3.5",
        optimistic.completed_today && !archivedView && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggle}
          disabled={archivedView}
          className={cn(
            "mt-0.5 size-8 shrink-0 rounded-full border-2 transition-all duration-150",
            optimistic.completed_today && "text-white",
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
              "text-[10px] font-bold transition-all duration-150",
              optimistic.completed_today
                ? "scale-100 opacity-100"
                : "scale-50 opacity-0",
            )}
          >
            ✓
          </span>
        </Button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              optimistic.completed_today &&
                !archivedView &&
                "text-muted-foreground line-through",
            )}
          >
            {optimistic.title}
          </p>
          {optimistic.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {optimistic.description}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
              {optimistic.current_streak}d
            </span>
            <span className="tabular-nums">
              Best {optimistic.longest_streak}d
            </span>
          </div>

          <div className="mt-2.5 flex max-w-xs gap-1">
            {optimistic.week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className={cn(
                  "h-1.5 flex-1 rounded-sm transition-colors",
                  !day.completed && "bg-muted",
                )}
                style={
                  day.completed
                    ? { backgroundColor: optimistic.color }
                    : undefined
                }
              />
            ))}
          </div>
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
    </li>
  );
}
