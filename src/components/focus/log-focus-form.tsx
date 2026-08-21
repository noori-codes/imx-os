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

const PRESETS = [25, 50, 90, 120, 180] as const;

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

  const summary =
    hours || minutes
      ? [hours && `${hours}h`, minutes && `${minutes}m`].filter(Boolean).join(" ")
      : null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Log manually
          </p>
          <p className="mt-1.5 text-sm text-foreground/90">
            {summary ? `Ready · ${summary}` : "Add focus you already did"}
          </p>
        </div>
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              applyMinutes(preset);
              setOpen(true);
            }}
            className="rounded-full bg-muted/50 px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {preset >= 120 ? `${preset / 60}h` : `${preset}m`}
          </button>
        ))}
      </div>

      {open ? (
        <form
          ref={formRef}
          action={formAction}
          className="mt-4 space-y-3 border-t border-border/50 pt-4"
        >
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <label
                htmlFor="focus-hours"
                className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
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
                placeholder="0"
                inputMode="numeric"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-10 rounded-xl border-border/50 bg-transparent"
              />
            </div>
            <span className="mb-2.5 text-muted-foreground">:</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <label
                htmlFor="focus-minutes"
                className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
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
                placeholder="25"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="h-10 rounded-xl border-border/50 bg-transparent"
              />
            </div>
          </div>

          {tasks.length > 0 ? (
            <select
              name="task_id"
              defaultValue=""
              aria-label="Link a task"
              className="h-10 w-full rounded-xl border border-border/50 bg-transparent px-3 text-sm text-foreground"
            >
              <option value="">Optional · link a task</option>
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
            placeholder="What did you work on?"
            className="h-10 rounded-xl border-border/50 bg-transparent"
          />

          <Button
            type="submit"
            disabled={pending}
            className="h-10 w-full rounded-xl"
          >
            {pending ? "Saving…" : "Seal session"}
          </Button>

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
