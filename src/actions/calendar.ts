"use server";

import { revalidatePath } from "next/cache";

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
    created_at: row.created_at,
    updated_at: row.updated_at,
    context: project && goal ? `${goal.title} · ${project.title}` : null,
    context_href:
      project && goal ? `/goals/${goal.id}/projects/${project.id}` : null,
  };
}

function revalidateCalendar() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
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
  const startTimeRaw = formData.get("start_time") as string;

  if (!title) {
    return { error: "Event title is required." };
  }

  if (!eventDate) {
    return { error: "Event date is required." };
  }

  const { error } = await supabase.from("calendar_events").insert({
    user_id: user.id,
    title,
    description,
    event_date: eventDate,
    start_time: startTimeRaw?.length ? startTimeRaw : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateCalendar();
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
    return;
  }

  revalidateCalendar();
}
