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

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-title">New event</Label>
        <Input
          id="event-title"
          name="title"
          placeholder="e.g. Dentist appointment"
          required
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-time">Time (optional)</Label>
        <Input id="event-time" name="start_time" type="time" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-description">Notes (optional)</Label>
        <Textarea
          id="event-description"
          name="description"
          rows={2}
          placeholder="Location or details"
        />
      </div>

      <Button type="submit" disabled={pending} size="sm">
        <Plus className="size-4" />
        {pending ? "Adding..." : "Add event"}
      </Button>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
