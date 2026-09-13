"use client";

import { useActionState, useState } from "react";

import { saveDailyReview, type ReviewActionState } from "@/actions/review";
import {
  ENERGY_SCALE,
  MOOD_SCALE,
  type ReviewScaleOption,
} from "@/lib/review-scale";
import { cn } from "@/lib/utils";
import type { DailyReview } from "@/types/review";

type ReviewFormProps = {
  date: string;
  review: DailyReview | null;
};

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
          How did the day feel — then three honest prompts.
        </p>
      </div>

      <div className="space-y-7 px-5 py-5 sm:px-6">
        <FeelingScale
          name="mood"
          legend="Mood"
          options={MOOD_SCALE}
          defaultValue={review?.mood}
        />
        <FeelingScale
          name="energy"
          legend="Energy"
          options={ENERGY_SCALE}
          defaultValue={review?.energy}
        />

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

function FeelingScale({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: ReviewScaleOption[];
  defaultValue: number | null | undefined;
}) {
  const [selected, setSelected] = useState<number | null>(
    defaultValue ?? null,
  );
  const active = options.find((item) => item.value === selected) ?? null;

  return (
    <fieldset className="review-feeling">
      <div className="flex items-end justify-between gap-3">
        <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {legend}
        </legend>
        {active ? (
          <p className="text-xs text-muted-foreground">{active.hint}</p>
        ) : (
          <p className="text-xs text-muted-foreground/70">Pick one</p>
        )}
      </div>

      <div className="review-feeling-grid mt-3 grid grid-cols-5 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isOn = selected === option.value;

          return (
            <label
              key={option.value}
              className="review-feeling-option group relative min-w-0 cursor-pointer"
              style={{ ["--i" as string]: option.value }}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-3 transition-all duration-200",
                  "border-border/45 bg-background/35",
                  "hover:-translate-y-0.5 hover:border-border hover:bg-muted/45",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40",
                  isOn &&
                    "review-feeling-on -translate-y-0.5 border-foreground bg-foreground text-background shadow-[0_10px_28px_oklch(0_0_0/0.14)]",
                )}
                data-level={option.value}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl transition-colors",
                    isOn ? "bg-background/15" : "bg-muted/50",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-transform duration-200",
                      isOn && "scale-110",
                    )}
                    strokeWidth={isOn ? 2.25 : 1.75}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide",
                    isOn ? "text-background" : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
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
