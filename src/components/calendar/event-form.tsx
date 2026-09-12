"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import {
  createCalendarEvent,
  type CalendarActionState,
} from "@/actions/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EventFormProps = {
  date: string;
};

export function EventForm({ date }: EventFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    CalendarActionState | null,
    FormData
  >(createCalendarEvent, null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="event_date" value={date} />

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          New event
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Lands on the selected day
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-title" className="sr-only">
          Title
        </Label>
        <Input
          id="event-title"
          name="title"
          placeholder="e.g. Dentist appointment"
          required
          autoComplete="off"
          className="bg-background/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="event-time">Time</Label>
          <Input
            id="event-time"
            name="start_time"
            type="time"
            className="bg-background/50"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-1">
          <Label htmlFor="event-description">Notes</Label>
          <Textarea
            id="event-description"
            name="description"
            rows={1}
            placeholder="Optional"
            className="min-h-9 resize-none bg-background/50"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} size="sm" className="rounded-xl">
        <Plus className="size-4" />
        {pending ? "Adding..." : "Add event"}
      </Button>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
