"use client";

import { useActionState, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  logManualFocusSession,
  type FocusActionState,
} from "@/actions/focus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FocusLinkableTask } from "@/types/task";

export function LogFocusForm({
  tasks = [],
}: {
  tasks?: FocusLinkableTask[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  function applyMinutes(totalMinutes: number) {
    setHours(String(Math.floor(totalMinutes / 60)));
    setMinutes(String(totalMinutes % 60));
  }

  const [state, formAction, pending] = useActionState<
    FocusActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await logManualFocusSession(prev, formData);
    if (!result.error) {
      formRef.current?.reset();
      setHours("");
      setMinutes("");
      setOpen(false);
    }
    return result;
  }, null);

  return (
    <section className="border-b border-border/60 pb-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Log focus manually</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Missed the timer? Add time with an optional note.
          </p>
        </div>
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Collapse manual entry" : "Expand manual entry"}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[25, 50, 90, 120, 180].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              applyMinutes(preset);
              setOpen(true);
            }}
            className="rounded-md bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground"
          >
            {preset >= 120 ? `${preset / 60}h` : `${preset}m`}
          </button>
        ))}
      </div>

      {open ? (
        <form ref={formRef} action={formAction} className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 items-end gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  htmlFor="focus-hours"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Hours
                </label>
                <Input
                  id="focus-hours"
                  name="hours"
                  type="number"
                  min={0}
                  max={12}
                  step={1}
                  placeholder="2"
                  inputMode="numeric"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  htmlFor="focus-minutes"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Minutes
                </label>
                <Input
                  id="focus-minutes"
                  name="minutes"
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  placeholder="0"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <Button type="submit" disabled={pending} size="sm" className="h-9">
              {pending ? "Saving..." : "Log"}
            </Button>
          </div>
          {tasks.length > 0 ? (
            <select
              name="task_id"
              defaultValue=""
              aria-label="Link a task"
              className="h-9 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
            >
              <option value="">No linked task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.context
                    ? `${task.title} · ${task.context}`
                    : task.title}
                </option>
              ))}
            </select>
          ) : null}
          <Input
            name="note"
            placeholder="What did you work on? (optional)"
            className="h-9"
          />
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
