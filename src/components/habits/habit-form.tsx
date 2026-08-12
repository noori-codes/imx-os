"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { createHabit, type HabitActionState } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#06b6d4", label: "Cyan" },
];

export function HabitForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    HabitActionState | null,
    FormData
  >(createHabit, null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="habit-title">New habit</Label>
          <Input
            id="habit-title"
            name="title"
            placeholder="e.g. Morning stretch"
            required
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="habit-description">Description (optional)</Label>
          <Textarea
            id="habit-description"
            name="description"
            placeholder="Why this habit matters"
            rows={2}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color, index) => (
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

        <Button type="submit" disabled={pending} className="w-fit">
          <Plus className="size-4" />
          {pending ? "Adding..." : "Add habit"}
        </Button>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
