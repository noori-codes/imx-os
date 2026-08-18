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

export function LogFocusForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, formAction, pending] = useActionState<
    FocusActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await logManualFocusSession(prev, formData);
    if (!result.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    return result;
  }, null);

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card px-5 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        Already focused? Log time
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

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
                  className="h-10 rounded-xl border-0 bg-muted/50 shadow-none"
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
                  className="h-10 rounded-xl border-0 bg-muted/50 shadow-none"
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
            className="h-10 rounded-xl border-0 bg-muted/50 shadow-none"
          />
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
