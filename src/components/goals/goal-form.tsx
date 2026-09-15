"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { createGoal, type GoalActionState } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";

type GoalFormProps = {
  variant?: "default" | "composer";
  autoFocusTitle?: boolean;
};

export function GoalForm({
  variant = "default",
  autoFocusTitle = false,
}: GoalFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const isComposer = variant === "composer";

  const [state, formAction, pending] = useActionState<
    GoalActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await createGoal(prev, formData);
    if (!result.error) {
      const title = String(formData.get("title") ?? "").trim();
      imxToast("Goal declared", {
        description: title || undefined,
        tone: "success",
      });
      formRef.current?.reset();
      setMoreOpen(false);
      queueMicrotask(() => titleRef.current?.focus());
    }
    return result;
  }, null);

  useEffect(() => {
    if (!autoFocusTitle) return;
    const frame = window.requestAnimationFrame(() => {
      titleRef.current?.focus();
      document
        .getElementById("goals-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocusTitle]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn(!isComposer && "border-b border-border/60 pb-5")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Plus className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={titleRef}
            name="title"
            placeholder="What are you working toward?"
            required
            autoComplete="off"
            data-imx-capture
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? "goal-form-error" : undefined}
            className={cn(
              "h-10 border-0 pl-9 shadow-none focus-visible:ring-1",
              isComposer ? "bg-muted/50" : "bg-muted/40",
            )}
            aria-label="New goal"
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
        <div className="mt-3">
          <Textarea
            name="description"
            placeholder="What does success look like?"
            rows={2}
            className="resize-none bg-muted/30"
          />
        </div>
      ) : null}

      <p className="mt-2 text-[11px] text-muted-foreground">
        Press <kbd className="rounded border px-1">N</kbd> to focus
      </p>

      {state?.error ? (
        <p
          id="goal-form-error"
          role="alert"
          className="mt-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
