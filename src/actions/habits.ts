"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import {
  computeStreaks,
  getPastDays,
  toDateString,
} from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type { HabitWithStats } from "@/types/habit";

export type HabitActionState = {
  error?: string;
};

const HABITS_PATH = "/habits";

async function revalidateHabits() {
  revalidatePath(HABITS_PATH);
  revalidatePath("/review");
  revalidatePath("/analytics");
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  } else {
    revalidatePath("/dashboard");
  }
}

async function loadHabitsWithStats(
  archived: boolean,
): Promise<HabitWithStats[]> {
  const supabase = await createClient();
  const today = toDateString(new Date());
  const weekDays = getPastDays(7);

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

  const streakLookback = new Date();
  streakLookback.setDate(streakLookback.getDate() - 90);
  const lookbackStr = toDateString(streakLookback);

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

    return {
      ...habit,
      completed_today: dateSet.has(today),
      current_streak,
      longest_streak,
      week: weekDays.map((day) => {
        const date = toDateString(day);
        return {
          date,
          completed: dateSet.has(date),
        };
      }),
    };
  });
}

export async function getHabitsWithStats(): Promise<HabitWithStats[]> {
  return loadHabitsWithStats(false);
}

export async function getArchivedHabitsWithStats(): Promise<HabitWithStats[]> {
  return loadHabitsWithStats(true);
}

export async function createHabit(
  _prevState: HabitActionState | null,
  formData: FormData,
): Promise<HabitActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const { error } = await supabase
    .from("habits")
    .update({
      title,
      description: input.description,
      color: input.color || "#3b82f6",
    })
    .eq("id", habitId);

  if (error) {
    return { error: error.message };
  }

  await revalidateHabits();
  return {};
}

export async function setHabitArchived(habitId: string, archived: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("habits")
    .update({ archived })
    .eq("id", habitId);

  if (error) {
    console.error("[habits] setHabitArchived:", error.message);
    return;
  }

  await revalidateHabits();
}

export async function toggleHabitToday(habitId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const today = toDateString(new Date());

  if (completed) {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      logged_on: today,
    });

    if (error && error.code !== "23505") {
      console.error("[habits] toggleHabitToday insert:", error.message);
      return;
    }
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("logged_on", today);

    if (error) {
      console.error("[habits] toggleHabitToday delete:", error.message);
      return;
    }
  }

  await revalidateHabits();
}

export async function deleteHabit(habitId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("habits").delete().eq("id", habitId);

  if (error) {
    console.error("[habits] deleteHabit:", error.message);
    return;
  }

  await revalidateHabits();
}
