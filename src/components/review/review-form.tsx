"use client";

import { useActionState } from "react";

import { saveDailyReview, type ReviewActionState } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      className="space-y-5 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div>
        <h2 className="text-sm font-semibold">Reflection</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Three prompts. Save anytime — you can come back and edit this day.
        </p>
      </div>

      <ScaleField
        name="mood"
        label="Mood"
        defaultValue={review?.mood}
      />
      <ScaleField
        name="energy"
        label="Energy"
        defaultValue={review?.energy}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="went_well">What went well?</Label>
        <Textarea
          id="went_well"
          name="went_well"
          rows={3}
          defaultValue={review?.went_well ?? ""}
          placeholder="Wins, progress, things you're grateful for"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="to_improve">What could be better?</Label>
        <Textarea
          id="to_improve"
          name="to_improve"
          rows={3}
          defaultValue={review?.to_improve ?? ""}
          placeholder="Friction, distractions, lessons"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tomorrow_focus">Tomorrow's focus</Label>
        <Textarea
          id="tomorrow_focus"
          name="tomorrow_focus"
          rows={3}
          defaultValue={review?.tomorrow_focus ?? ""}
          placeholder="The 1–3 things that matter most tomorrow"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : review ? "Update review" : "Save review"}
        </Button>
        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state?.saved && !state.error ? (
          <p className="text-sm text-muted-foreground">Saved</p>
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
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {SCALE.map((value) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
                "hover:bg-accent",
              )}
            >
              {value}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">1 low · 5 high</p>
    </fieldset>
  );
}
