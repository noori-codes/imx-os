"use client";

import { useActionState, useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";

import {
  createCalendarEvent,
  updateCalendarEvent,
  type CalendarActionState,
} from "@/actions/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultFocusBlockTimes,
  encodeFocusBlock,
  parseFocusBlock,
} from "@/lib/focus-calendar-block";
import { addDays, startOfDay, toDateString } from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

type EventFormProps = {
  date: string;
  event?: CalendarEvent;
  onCancel?: () => void;
  onSaved?: () => void;
  /** Autofocus title (calendar ?compose=1). */
  autoFocus?: boolean;
};

export function EventForm({
  date,
  event,
  onCancel,
  onSaved,
  autoFocus = false,
}: EventFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const editing = Boolean(event);
  const action = event
    ? updateCalendarEvent.bind(null, event.id)
    : createCalendarEvent;
  const [state, formAction, pending] = useActionState<
    CalendarActionState | null,
    FormData
  >(action, null);
  const [eventDate, setEventDate] = useState(event?.event_date ?? date);
  const [allDay, setAllDay] = useState(!event?.start_time);
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const focusBlock = parseFocusBlock(description);
  const isFocusBlock = focusBlock.isFocusBlock;
  const focusDone = focusBlock.done;

  useEffect(() => {
    setEventDate(event?.event_date ?? date);
    setAllDay(!event?.start_time);
    setStartTime(event?.start_time?.slice(0, 5) ?? "");
    setEndTime(event?.end_time?.slice(0, 5) ?? "");
    setDescription(event?.description ?? "");
  }, [event?.event_date, event?.id, event?.start_time, event?.end_time, event?.description, date]);

  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));

  const handleSuccess = useEffectEvent(() => {
    if (editing) {
      imxToast("Event updated", { tone: "success" });
      onSaved?.();
      if (eventDate !== date) {
        const params = new URLSearchParams(window.location.search);
        params.set("date", eventDate);
        params.delete("compose");
        router.push(`/calendar?${params.toString()}`);
      } else {
        router.refresh();
      }
      return;
    }
    formRef.current?.reset();
    setAllDay(true);
    setStartTime("");
    setEndTime("");
    setDescription("");
    imxToast("Event added", { tone: "success" });
    if (eventDate !== date) {
      const params = new URLSearchParams(window.location.search);
      params.set("date", eventDate);
      params.delete("compose");
      router.push(`/calendar?${params.toString()}`);
    } else {
      setEventDate(date);
      router.refresh();
    }
  });

  useEffect(() => {
    if (!state || state.error) return;
    handleSuccess();
  }, [state, handleSuccess]);

  return (
    <form
      key={event?.id ?? "new"}
      ref={formRef}
      action={formAction}
      className="space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {editing
              ? isFocusBlock
                ? "Edit Focus block"
                : "Edit event"
              : "New event"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {editing
              ? isFocusBlock
                ? "Timed block that deep-links into Focus"
                : "Change day, time, or details"
              : "Pick a day, then title and time"}
          </p>
        </div>
        {editing && onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Cancel edit"
            onClick={onCancel}
          >
            <X className="size-4" />
          </Button>
        ) : null}
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
          autoFocus={autoFocus}
          data-imx-capture-primary={!editing ? true : undefined}
          data-imx-capture={!editing ? true : undefined}
          defaultValue={event?.title ?? ""}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "event-form-error" : undefined}
          className="bg-surface"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-date">Date</Label>
        <Input
          id="event-date"
          name="event_date"
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="bg-surface"
        />
        <div className="flex flex-wrap gap-1">
          {(
            [
              { label: "Today", value: today },
              { label: "Tomorrow", value: tomorrow },
            ] as const
          ).map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setEventDate(chip.value)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                eventDate === chip.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setAllDay(true);
              setStartTime("");
              setEndTime("");
            }}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              allDay
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            All day
          </button>
          <button
            type="button"
            onClick={() => {
              setAllDay(false);
              if (!startTime) setStartTime("09:00");
            }}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              !allDay
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Timed
          </button>
        </div>

        {!allDay ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="event-time">Starts</Label>
                <Input
                  id="event-time"
                  name="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-surface"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="event-end-time">Ends</Label>
                <Input
                  id="event-end-time"
                  name="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-surface"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { label: "9:00", value: "09:00" },
                  { label: "12:00", value: "12:00" },
                  { label: "15:00", value: "15:00" },
                  { label: "18:00", value: "18:00" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStartTime(chip.value)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    startTime === chip.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {chip.label}
                </button>
              ))}
              {(
                [
                  { label: "+25m", minutes: 25 },
                  { label: "+30m", minutes: 30 },
                  { label: "+1h", minutes: 60 },
                  { label: "+2h", minutes: 120 },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={!startTime}
                  onClick={() => {
                    if (!startTime) return;
                    const [h, m] = startTime.split(":").map(Number);
                    const total = h * 60 + m + chip.minutes;
                    const hh = Math.floor(total / 60) % 24;
                    const mm = total % 60;
                    setEndTime(
                      `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
                    );
                  }}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    !startTime
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="start_time" value="" />
            <input type="hidden" name="end_time" value="" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="event-description">Notes</Label>
          {!editing ? (
            <button
              type="button"
              onClick={() => {
                const times = defaultFocusBlockTimes(25);
                setAllDay(false);
                setStartTime(times.start);
                setEndTime(times.end);
                setDescription(encodeFocusBlock());
                const title = formRef.current?.querySelector<HTMLInputElement>(
                  "#event-title",
                );
                if (title && !title.value.trim()) {
                  title.value = "Focus block";
                }
              }}
              className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Mark as Focus block
            </button>
          ) : null}
        </div>
        <Textarea
          id="event-description"
          name="description"
          rows={2}
          placeholder={
            isFocusBlock
              ? "imx:focus (links into Focus)"
              : "Optional"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-9 resize-none bg-surface"
        />
        {isFocusBlock ? (
          <p className="text-[11px] text-muted-foreground">
            {focusDone ? (
              <>
                Sealed after Focus — remove{" "}
                <code className="text-[10px]">imx:focus:done</code> to reopen.
              </>
            ) : (
              <>
                Keep the <code className="text-[10px]">imx:focus</code> line so the
                block opens Focus.
              </>
            )}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} size="sm" className="rounded-xl">
        {editing ? (
          <Check className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
        {pending
          ? editing
            ? "Saving…"
            : "Adding…"
          : editing
            ? "Save event"
            : "Add event"}
      </Button>

      {state?.error ? (
        <p
          id="event-form-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
