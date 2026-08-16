"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { createHabit, type HabitActionState } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { HABIT_COLORS } from "@/types/habit";

export function HabitForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const [state, formAction, pending] = useActionState<
    HabitActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await createHabit(prev, formData);
    if (!result.error) {
      formRef.current?.reset();
      setMoreOpen(false);
      queueMicrotask(() => titleRef.current?.focus());
    }
    return result;
  }, null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "n" && e.key !== "N") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      titleRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-b border-border/60 pb-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Plus className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={titleRef}
            name="title"
            placeholder="New daily habit"
            required
            autoComplete="off"
            className="h-10 border-0 bg-muted/40 pl-9 shadow-none focus-visible:ring-1"
            aria-label="New habit"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            More
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                moreOpen && "rotate-180",
              )}
            />
          </Button>
          <Button type="submit" disabled={pending} size="sm" className="h-9">
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      {moreOpen ? (
        <div className="mt-3 space-y-3">
          <Textarea
            name="description"
            placeholder="Why this habit matters"
            rows={2}
            className="resize-none bg-muted/30"
          />
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted-foreground">
              Color
            </legend>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((color, index) => (
                <label key={color.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color.value}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                  />
                  <span
                    title={color.label}
                    className="block size-7 rounded-full ring-offset-background transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2"
                    style={{ backgroundColor: color.value }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <input type="hidden" name="color" value={HABIT_COLORS[0].value} />
      )}

      <p className="mt-2 text-[11px] text-muted-foreground">
        Press <kbd className="rounded border px-1">N</kbd> to focus
      </p>

      {state?.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
