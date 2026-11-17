"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateHabitCaches } from "@/lib/cache";
import {
  addDaysToDateString,
  computeStreaks,
} from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import { getTodayString } from "@/lib/timezone";
import type { HabitWithStats } from "@/types/habit";

export type HabitActionState = {
  error?: string;
};

async function revalidateHabits() {
  const user = await getCurrentUser();
  if (user) {
    revalidateHabitCaches(user.id);
  } else {
    revalidatePath("/habits");
    revalidatePath("/review");
    revalidatePath("/analytics");
  }
}

async function loadHabitsWithStats(
  archived: boolean,
): Promise<HabitWithStats[]> {
  const supabase = await createClient();
  const today = await getTodayString();
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDaysToDateString(today, -(6 - i)),
  );

  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", archived)
    .order("created_at", { ascending: true });

  if (error || !habits) {
    console.error("[habits] loadHabitsWithStats:", error?.message);
    return [];
  }

  if (habits.length === 0) {
    return [];
  }

  const habitIds = habits.map((h) => h.id);

  const lookbackStr = addDaysToDateString(today, -90);

  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("*")
    .in("habit_id", habitIds)
    .gte("logged_on", lookbackStr)
    .order("logged_on", { ascending: true });

  if (logsError) {
    console.error("[habits] loadHabitsWithStats logs:", logsError.message);
  }

  const logsByHabit = new Map<string, string[]>();
  for (const log of logs ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.logged_on);
    logsByHabit.set(log.habit_id, list);
  }

  return habits.map((habit) => {
    const dates = logsByHabit.get(habit.id) ?? [];
    const dateSet = new Set(dates);
    const { current_streak, longest_streak } = computeStreaks(dates, today);

    const schedule_days = Array.isArray(habit.schedule_days)
      ? (habit.schedule_days as number[])
      : null;

    return {
      ...habit,
      schedule_days,
      completed_today: dateSet.has(today),
      current_streak,
      longest_streak,
      week: weekDays.map((date) => ({
        date,
        completed: dateSet.has(date),
      })),
    };
  });
}

export async function getHabitsWithStats(): Promise<HabitWithStats[]> {
  return loadHabitsWithStats(false);
}

export async function getArchivedHabitsWithStats(): Promise<HabitWithStats[]> {
  return loadHabitsWithStats(true);
}

/** Lightweight tab badge — no habit_logs. */
export async function countHabits(archived: boolean): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true })
    .eq("archived", archived);

  if (error) {
    console.error("[habits] countHabits:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function createHabit(
  _prevState: HabitActionState | null,
  formData: FormData,
): Promise<HabitActionState> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const color = (formData.get("color") as string) || "#3b82f6";

  if (!title) {
    return { error: "Habit title is required." };
  }

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    title,
    description,
    color,
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateHabits();
  return {};
}

export async function updateHabit(
  habitId: string,
  input: {
    title: string;
    description: string | null;
    color: string;
  },
): Promise<HabitActionState> {
  const title = input.title.trim();
  if (!title) {
    return { error: "Habit title is required." };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("habits")
    .update({
      title,
      description: input.description,
      color: input.color || "#3b82f6",
    })
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return { error: "Couldn’t save. Try again." };
  }
  if (!data?.length) {
    return { error: "Not found." };
  }

  await revalidateHabits();
  return {};
}

export async function setHabitArchived(habitId: string, archived: boolean) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("habits")
    .update({ archived })
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[habits] setHabitArchived:", error.message);
    return;
  }
  if (!data?.length) return;

  await revalidateHabits();
}

export async function toggleHabitOnDate(
  habitId: string,
  loggedOn: string,
  completed: boolean,
): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(loggedOn)) {
    return { error: "Invalid date." };
  }

  const today = await getTodayString();
  if (loggedOn > today) {
    return { error: "Can’t log a future day." };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  if (completed) {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      logged_on: loggedOn,
    });

    if (error && error.code !== "23505") {
      console.error("[habits] toggleHabitOnDate insert:", error.message);
      return { error: "Couldn’t save. Try again." };
    }
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("logged_on", loggedOn)
      .eq("user_id", user.id);

    if (error) {
      console.error("[habits] toggleHabitOnDate delete:", error.message);
      return { error: "Couldn’t save. Try again." };
    }
  }

  await revalidateHabits();
  return {};
}

export async function toggleHabitToday(
  habitId: string,
  completed: boolean,
): Promise<{ error?: string }> {
  return toggleHabitOnDate(habitId, await getTodayString(), completed);
}

export async function deleteHabit(habitId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[habits] deleteHabit:", error.message);
    return;
  }
  if (!data?.length) return;

  await revalidateHabits();
}
