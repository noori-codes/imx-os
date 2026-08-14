"use server";

import { revalidatePath } from "next/cache";

import { addDays, parseDateString } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type {
  DailyReview,
  ReviewHabit,
  ReviewPageData,
  ReviewRecap,
  ReviewTask,
} from "@/types/review";

export type ReviewActionState = {
  error?: string;
  saved?: boolean;
};

function dayBounds(dateStr: string) {
  const start = parseDateString(dateStr);
  const end = addDays(start, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getReviewPageData(date: string): Promise<ReviewPageData> {
  const supabase = await createClient();
  const { start, end } = dayBounds(date);

  const [
    reviewResult,
    recentResult,
    dueTasksResult,
    completedTasksResult,
    habitsResult,
    habitLogsResult,
    focusResult,
    eventsResult,
    journalResult,
  ] = await Promise.all([
    supabase
      .from("daily_reviews")
      .select("*")
      .eq("review_date", date)
      .maybeSingle(),
    supabase
      .from("daily_reviews")
      .select("id, review_date, mood")
      .order("review_date", { ascending: false })
      .limit(14),
    supabase
      .from("tasks")
      .select("id, title, completed, due_date")
      .eq("due_date", date)
      .order("completed", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, completed, due_date")
      .eq("completed", true)
      .gte("updated_at", start)
      .lt("updated_at", end)
      .order("updated_at", { ascending: false }),
    supabase
      .from("habits")
      .select("id, title, color")
      .eq("archived", false)
      .order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("habit_id").eq("logged_on", date),
    supabase
      .from("focus_sessions")
      .select("actual_seconds")
      .eq("mode", "focus")
      .gte("started_at", start)
      .lt("started_at", end),
    supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("event_date", date),
    supabase
      .from("notes")
      .select("id")
      .eq("type", "journal")
      .eq("journal_date", date)
      .maybeSingle(),
  ]);

  if (reviewResult.error) {
    console.error("[review] get review:", reviewResult.error.message);
  }

  const doneHabitIds = new Set(
    (habitLogsResult.data ?? []).map((log) => log.habit_id),
  );

  const habits: ReviewHabit[] = (habitsResult.data ?? []).map((habit) => ({
    id: habit.id,
    title: habit.title,
    color: habit.color,
    completed: doneHabitIds.has(habit.id),
  }));

  const recap: ReviewRecap = {
    date,
    tasks_due: (dueTasksResult.data ?? []) as ReviewTask[],
    tasks_completed: (completedTasksResult.data ?? []) as ReviewTask[],
    habits,
    habits_done: habits.filter((h) => h.completed).length,
    habits_total: habits.length,
    focus_sessions: focusResult.data?.length ?? 0,
    focus_minutes: Math.round(
      (focusResult.data ?? []).reduce(
        (sum, session) => sum + session.actual_seconds,
        0,
      ) / 60,
    ),
    events_count: eventsResult.count ?? 0,
    has_journal: Boolean(journalResult.data),
    journal_id: journalResult.data?.id ?? null,
  };

  return {
    recap,
    review: (reviewResult.data as DailyReview | null) ?? null,
    recent: recentResult.data ?? [],
  };
}

export async function saveDailyReview(
  date: string,
  _prevState: ReviewActionState | null,
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const went_well = ((formData.get("went_well") as string) ?? "").trim();
  const to_improve = ((formData.get("to_improve") as string) ?? "").trim();
  const tomorrow_focus = ((formData.get("tomorrow_focus") as string) ?? "").trim();
  const moodRaw = formData.get("mood") as string;
  const energyRaw = formData.get("energy") as string;

  const mood = moodRaw ? Number(moodRaw) : null;
  const energy = energyRaw ? Number(energyRaw) : null;

  if (mood !== null && (mood < 1 || mood > 5)) {
    return { error: "Mood must be between 1 and 5." };
  }
  if (energy !== null && (energy < 1 || energy > 5)) {
    return { error: "Energy must be between 1 and 5." };
  }

  const { error } = await supabase.from("daily_reviews").upsert(
    {
      user_id: user.id,
      review_date: date,
      went_well,
      to_improve,
      tomorrow_focus,
      mood,
      energy,
    },
    { onConflict: "user_id,review_date" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/review");
  revalidatePath("/dashboard");
  return { saved: true };
}

export async function deleteDailyReview(date: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_reviews")
    .delete()
    .eq("review_date", date);

  if (error) {
    console.error("[review] deleteDailyReview:", error.message);
    return;
  }

  revalidatePath("/review");
}
