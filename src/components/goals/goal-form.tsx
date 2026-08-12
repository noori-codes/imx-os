"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { createGoal, type GoalActionState } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function GoalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    GoalActionState | null,
    FormData
  >(createGoal, null);

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
          <Label htmlFor="goal-title">New goal</Label>
          <Input
            id="goal-title"
            name="title"
            placeholder="e.g. Launch my side project"
            required
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="goal-description">Description (optional)</Label>
          <Textarea
            id="goal-description"
            name="description"
            placeholder="What does success look like?"
            rows={2}
          />
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          <Plus className="size-4" />
          {pending ? "Adding..." : "Add goal"}
        </Button>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
