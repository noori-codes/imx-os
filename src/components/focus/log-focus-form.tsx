"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  logManualFocusSession,
  type FocusActionState,
} from "@/actions/focus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { celebrateMarathonSessionIfNeeded } from "@/lib/focus-celebrate";
import {
  commitFocusSessionOptimistic,
  rollbackFocusSessionOptimistic,
} from "@/lib/focus-optimistic";
import { cn } from "@/lib/utils";
import { buildOptimisticFocusSession } from "@/types/focus";
import type { FocusLinkableTask } from "@/types/task";

const PRESETS = [25, 50, 90, 120, 180] as const;

export function LogFocusForm({
  tasks = [],
}: {
  tasks?: FocusLinkableTask[];
}) {
  const router = useRouter();
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
    const parsedHours = Number(formData.get("hours") ?? 0);
    const parsedMinutes = Number(formData.get("minutes") ?? 0);
    const note = (formData.get("note") as string | null)?.trim() || null;
    const taskRaw = (formData.get("task_id") as string | null)?.trim() || "";
    const task_id = taskRaw.length ? taskRaw : null;
    const linkedTask = task_id
      ? tasks.find((task) => task.id === task_id)
      : undefined;

    if (
      Number.isFinite(parsedHours) &&
      Number.isFinite(parsedMinutes) &&
      parsedHours >= 0 &&
      parsedMinutes >= 0 &&
      parsedMinutes <= 59
    ) {
      const actual_seconds = Math.round(parsedHours * 3600 + parsedMinutes * 60);
      if (actual_seconds >= 60) {
        const started_at = new Date(
          Date.now() - actual_seconds * 1000,
        ).toISOString();
        commitFocusSessionOptimistic(
          buildOptimisticFocusSession({
            mode: "focus",
            planned_seconds: actual_seconds,
            actual_seconds,
            completed: true,
            note,
            task_id,
            task_title: linkedTask?.title ?? null,
            started_at,
          }),
        );
        celebrateMarathonSessionIfNeeded({ sessionSeconds: actual_seconds });
      }
    }

    const result = await logManualFocusSession(prev, formData);
    if (result.error) {
      rollbackFocusSessionOptimistic();
    } else {
      router.refresh();
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
    <section className="opacity-80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <p className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          {summary
            ? `Add past focus · ${summary}`
            : "Add past focus · forgot to start the timer?"}
        </p>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <form
          ref={formRef}
          action={formAction}
          className="mt-4 space-y-3 opacity-100"
        >
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyMinutes(preset)}
                className="rounded-full px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {preset >= 120 ? `${preset / 60}h` : `${preset}m`}
              </button>
            ))}
          </div>

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
                className="h-10 rounded-xl border-border/40 bg-transparent"
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
                className="h-10 rounded-xl border-border/40 bg-transparent"
              />
            </div>
          </div>

          {tasks.length > 0 ? (
            <select
              name="task_id"
              defaultValue=""
              aria-label="Link a task"
              className="h-10 w-full rounded-xl border border-border/40 bg-transparent px-3 text-sm text-foreground"
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
            className="h-10 rounded-xl border-border/40 bg-transparent"
          />

          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            className="h-10 w-full rounded-xl"
          >
            {pending ? "Saving…" : "Add past focus"}
          </Button>

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
