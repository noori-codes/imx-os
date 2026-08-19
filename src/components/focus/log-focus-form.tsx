"use client";

import { useActionState, useRef, useState } from "react";
import { ChevronDown, Timer } from "lucide-react";

import {
  logManualFocusSession,
  type FocusActionState,
} from "@/actions/focus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LogFocusForm() {
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
    <section className="flex h-full flex-col rounded-[1.75rem] border border-border/60 bg-card/95 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Manual Entry
          </p>
          <h2 className="mt-1 text-base font-semibold">Add focus you already did</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Missed the timer? Save a completed session with a note.
          </p>
        </div>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/25 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
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

      <div className="mt-4 rounded-3xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Timer className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground/90">Quick add</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[25, 50, 90].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                applyMinutes(preset);
                setOpen(true);
              }}
              className="rounded-full border border-border/70 bg-background/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
            >
              {preset}m
            </button>
          ))}
          {[120, 180].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                applyMinutes(preset);
                setOpen(true);
              }}
              className="rounded-full border border-border/70 bg-background/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
            >
              {preset / 60}h
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <form ref={formRef} action={formAction} className="mt-4 flex flex-1 flex-col space-y-3">
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
                  className="h-10 rounded-xl border-0 bg-muted/35 shadow-none"
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
                  className="h-10 rounded-xl border-0 bg-muted/35 shadow-none"
                />
              </div>
            </div>
            <Button type="submit" disabled={pending} size="sm" className="h-9">
              {pending ? "Saving..." : "Log"}
            </Button>
          </div>
          <Input
            name="note"
            placeholder="What did you work on? (optional)"
            className="h-10 rounded-xl border-0 bg-muted/35 shadow-none"
          />
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      ) : (
        <p className="mt-auto pt-4 text-sm text-muted-foreground">
          Expand to enter hours, minutes, and an optional note.
        </p>
      )}
    </section>
  );
}
