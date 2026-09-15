"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import {
  addDays,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import { stripNoteHtml } from "@/lib/note-preview";
import { createClient } from "@/lib/supabase/server";
import type {
  CalendarData,
  CalendarDayItems,
  CalendarEvent,
  CalendarTask,
} from "@/types/calendar";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

export type CalendarActionState = {
  error?: string;
};

type TaskRow = Task & {
  projects: {
    id: string;
    title: string;
    goal_id: string;
    goals: { id: string; title: string } | null;
  } | null;
};

function emptyDay(date: string): CalendarDayItems {
  return { date, events: [], tasks: [], journals: [] };
}

function mapTask(row: TaskRow): CalendarTask {
  const project = row.projects;
  const goal = project?.goals ?? null;

  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    title: row.title,
    completed: row.completed,
    due_date: row.due_date,
    recurrence: row.recurrence ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    context: project && goal ? `${goal.title} · ${project.title}` : null,
    context_href:
      project && goal ? `/goals/${goal.id}/projects/${project.id}` : null,
  };
}

async function revalidateCalendar() {
  revalidatePath("/calendar");
  revalidatePath("/review");
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  } else {
    revalidatePath("/dashboard");
  }
}

export async function getCalendarData(
  rangeStart: string,
  rangeEnd: string,
): Promise<CalendarData> {
  const supabase = await createClient();

  const [eventsResult, tasksResult, journalsResult] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .gte("event_date", rangeStart)
      .lte("event_date", rangeEnd)
      .order("start_time", { ascending: true, nullsFirst: true }),
    supabase
      .from("tasks")
      .select(
        `
        *,
        projects (
          id,
          title,
          goal_id,
          goals ( id, title )
        )
      `,
      )
      .gte("due_date", rangeStart)
      .lte("due_date", rangeEnd)
      .order("due_date", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("type", "journal")
      .gte("journal_date", rangeStart)
      .lte("journal_date", rangeEnd)
      .order("journal_date", { ascending: true }),
  ]);

  if (eventsResult.error) {
    console.error("[calendar] events:", eventsResult.error.message);
  }
  if (tasksResult.error) {
    console.error("[calendar] tasks:", tasksResult.error.message);
  }
  if (journalsResult.error) {
    console.error("[calendar] journals:", journalsResult.error.message);
  }

  const days: Record<string, CalendarDayItems> = {};

  function dayFor(date: string) {
    if (!days[date]) {
      days[date] = emptyDay(date);
    }
    return days[date];
  }

  for (const event of (eventsResult.data ?? []) as CalendarEvent[]) {
    dayFor(event.event_date).events.push(event);
  }

  for (const row of (tasksResult.data ?? []) as TaskRow[]) {
    if (!row.due_date) continue;
    dayFor(row.due_date).tasks.push(mapTask(row));
  }

  for (const note of (journalsResult.data ?? []) as Note[]) {
    if (!note.journal_date) continue;
    dayFor(note.journal_date).journals.push(note);
  }

  return { rangeStart, rangeEnd, days };
}

export async function createCalendarEvent(
  _prevState: CalendarActionState | null,
  formData: FormData,
): Promise<CalendarActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const eventDate = formData.get("event_date") as string;
  const startTimeRaw = (formData.get("start_time") as string)?.trim() || "";
  const endTimeRaw = (formData.get("end_time") as string)?.trim() || "";

  if (!title) {
    return { error: "Event title is required." };
  }

  if (!eventDate) {
    return { error: "Event date is required." };
  }

  const start_time = startTimeRaw.length ? startTimeRaw : null;
  const end_time = endTimeRaw.length ? endTimeRaw : null;

  if (end_time && !start_time) {
    return { error: "Add a start time before setting an end time." };
  }

  if (start_time && end_time && end_time <= start_time) {
    return { error: "End time must be after start time." };
  }

  const { error } = await supabase.from("calendar_events").insert({
    user_id: user.id,
    title,
    description,
    event_date: eventDate,
    start_time,
    end_time,
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateCalendar();
  return {};
}

export async function updateCalendarEvent(
  eventId: string,
  _prevState: CalendarActionState | null,
  formData: FormData,
): Promise<CalendarActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const eventDate = formData.get("event_date") as string;
  const startTimeRaw = (formData.get("start_time") as string)?.trim() || "";
  const endTimeRaw = (formData.get("end_time") as string)?.trim() || "";

  if (!title) {
    return { error: "Event title is required." };
  }

  if (!eventDate) {
    return { error: "Event date is required." };
  }

  const start_time = startTimeRaw.length ? startTimeRaw : null;
  const end_time = endTimeRaw.length ? endTimeRaw : null;

  if (end_time && !start_time) {
    return { error: "Add a start time before setting an end time." };
  }

  if (start_time && end_time && end_time <= start_time) {
    return { error: "End time must be after start time." };
  }

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title,
      description,
      event_date: eventDate,
      start_time,
      end_time,
    })
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  await revalidateCalendar();
  return {};
}

export async function deleteCalendarEvent(eventId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    console.error("[calendar] deleteCalendarEvent:", error.message);
    return { error: error.message };
  }

  await revalidateCalendar();
  return {};
}

export async function duplicateCalendarEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: event, error: fetchError } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }
  if (!event) {
    return { error: "Event not found." };
  }

  const nextDate = toDateString(addDays(parseDateString(event.event_date), 1));

  const { data: created, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: event.title,
      description: event.description,
      event_date: nextDate,
      start_time: event.start_time,
      end_time: event.end_time,
    })
    .select("id, event_date")
    .single();

  if (error) {
    return { error: error.message };
  }

  await revalidateCalendar();
  return { id: created.id as string, event_date: created.event_date as string };
}

export async function createEventFromNote(noteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: note, error: fetchError } = await supabase
    .from("notes")
    .select("id, title, content, journal_date, type")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }
  if (!note) {
    return { error: "Note not found." };
  }

  const title = (note.title as string)?.trim() || "Untitled";
  const plain = stripNoteHtml((note.content as string) ?? "").trim();
  const description = plain ? plain.slice(0, 500) : null;
  const event_date =
    (note.journal_date as string | null) ?? toDateString(new Date());

  const { data: created, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title,
      description,
      event_date,
      start_time: null,
      end_time: null,
    })
    .select("id, event_date")
    .single();

  if (error) {
    return { error: error.message };
  }

  await revalidateCalendar();
  revalidatePath(`/notes/${noteId}`);
  return { id: created.id as string, event_date: created.event_date as string };
}
