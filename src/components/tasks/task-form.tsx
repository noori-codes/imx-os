"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { createTask, type TaskActionState } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    TaskActionState | null,
    FormData
  >(createTask, null);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="title">New task</Label>
          <Input
            id="title"
            name="title"
            placeholder="What needs to be done?"
            required
            autoComplete="off"
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-44">
          <Label htmlFor="due_date">Due date (optional)</Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>

        <Button type="submit" disabled={pending} className="sm:mb-0.5">
          <Plus className="size-4" />
          {pending ? "Adding..." : "Add task"}
        </Button>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
