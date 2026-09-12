"use client";

import { useActionState } from "react";

import { saveDailyReview, type ReviewActionState } from "@/actions/review";
import { cn } from "@/lib/utils";
import type { DailyReview } from "@/types/review";

type ReviewFormProps = {
  date: string;
  review: DailyReview | null;
};

const SCALE = [1, 2, 3, 4, 5] as const;

export function ReviewForm({ date, review }: ReviewFormProps) {
  const saveForDate = saveDailyReview.bind(null, date);
  const [state, formAction, pending] = useActionState<
    ReviewActionState | null,
    FormData
  >(saveForDate, null);

  return (
    <form
      action={formAction}
      className={cn(
        "review-form overflow-hidden rounded-2xl border border-border/50 bg-card/80",
        review && "border-foreground/10",
      )}
    >
      <div className="border-b border-border/40 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Reflection
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          {review ? "Edit this day" : "Close the loop"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mood, energy, and three prompts. Save anytime — you can return.
        </p>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ScaleField name="mood" label="Mood" defaultValue={review?.mood} />
          <ScaleField
            name="energy"
            label="Energy"
            defaultValue={review?.energy}
          />
        </div>

        <PromptField
          id="went_well"
          name="went_well"
          label="What went well?"
          hint="Wins, progress, gratitude"
          defaultValue={review?.went_well ?? ""}
          placeholder="Name the things worth keeping…"
        />

        <PromptField
          id="to_improve"
          name="to_improve"
          label="What could be better?"
          hint="Friction, distractions, lessons"
          defaultValue={review?.to_improve ?? ""}
          placeholder="What would you adjust next time…"
        />

        <PromptField
          id="tomorrow_focus"
          name="tomorrow_focus"
          label="Tomorrow's focus"
          hint="Shows on your dashboard greeting"
          defaultValue={review?.tomorrow_focus ?? ""}
          placeholder="The 1–3 things that matter most…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/40 px-5 py-4 sm:px-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : review
              ? "Update review"
              : "Save review"}
        </button>
        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state?.saved && !state.error ? (
          <p className="text-sm text-muted-foreground">Saved</p>
        ) : review && !state?.saved ? (
          <p className="text-sm text-muted-foreground">Previously sealed</p>
        ) : null}
      </div>
    </form>
  );
}

function ScaleField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number | null | undefined;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </legend>
      <div className="mt-2.5 flex gap-2">
        {SCALE.map((value) => (
          <label key={value} className="min-w-0 flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-11 items-center justify-center rounded-xl border border-border/50 text-sm font-semibold tabular-nums transition-colors",
                "hover:border-border hover:bg-muted/40",
                "peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40",
              )}
            >
              {value}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">1 low · 5 high</p>
    </fieldset>
  );
}

function PromptField({
  id,
  name,
  label,
  hint,
  defaultValue,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <textarea
        id={id}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-border/50 bg-background/40 px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-border focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}
