"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery, revalidateUserCaches } from "@/lib/cache";
import { toDateString } from "@/lib/date-utils";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Note, NoteType } from "@/types/note";

export type NoteActionState = {
  error?: string;
};

type QueryClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

async function revalidateNotes(noteId?: string) {
  revalidatePath("/notes");
  revalidatePath("/calendar");
  revalidatePath("/review");
  if (noteId) {
    revalidatePath(`/notes/${noteId}`);
  }
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  }
}

function notesClient(userId: string | null): QueryClient | Promise<QueryClient> {
  if (userId && hasAdminClient()) {
    return createAdminClient();
  }
  return createClient();
}

async function loadNotes(
  userId: string | null,
  type?: NoteType,
): Promise<Note[]> {
  const supabase = await notesClient(userId);

  let query = supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (userId && hasAdminClient()) {
    query = query.eq("user_id", userId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[notes] getNotes:", error.message);
    return [];
  }

  return data ?? [];
}

async function loadNote(
  userId: string | null,
  noteId: string,
): Promise<Note | null> {
  const supabase = await notesClient(userId);

  let query = supabase.from("notes").select("*").eq("id", noteId);

  if (userId && hasAdminClient()) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[notes] getNote:", error.message);
    return null;
  }

  return data;
}

async function loadTodayJournal(userId: string | null): Promise<Note | null> {
  const supabase = await notesClient(userId);
  const today = toDateString(new Date());

  let query = supabase
    .from("notes")
    .select("*")
    .eq("type", "journal")
    .eq("journal_date", today);

  if (userId && hasAdminClient()) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[notes] getTodayJournal:", error.message);
    return null;
  }

  return data;
}

/** Notes list — request memoized; cross-request cached when service role is set. */
export const getNotes = cache(async (type?: NoteType): Promise<Note[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  if (hasAdminClient()) {
    return cachedQuery(
      ["notes", user.id, type ?? "all", "v1"],
      [cacheTags.notes(user.id)],
      CACHE_TTL.notes,
      async () => loadNotes(user.id, type),
    )();
  }

  return loadNotes(null, type);
});

/** Single note — request memoized; cross-request cached when service role is set. */
export const getNote = cache(async (noteId: string): Promise<Note | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (hasAdminClient()) {
    return cachedQuery(
      ["notes", user.id, "detail", noteId, "v1"],
      [cacheTags.notes(user.id)],
      CACHE_TTL.notes,
      async () => loadNote(user.id, noteId),
    )();
  }

  return loadNote(null, noteId);
});

/** Today's journal — request memoized; cross-request cached when service role is set. */
export const getTodayJournal = cache(async (): Promise<Note | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const today = toDateString(new Date());

  if (hasAdminClient()) {
    return cachedQuery(
      ["notes", user.id, "journal", today, "v1"],
      [cacheTags.notes(user.id)],
      CACHE_TTL.notes,
      async () => loadTodayJournal(user.id),
    )();
  }

  return loadTodayJournal(null);
});

export async function createNote(type: NoteType = "note") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = toDateString(new Date());

  if (type === "journal") {
    const existing = await getTodayJournal();
    if (existing) {
      redirect(`/notes/${existing.id}`);
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: `Journal · ${today}`,
        content: "",
        type: "journal",
        journal_date: today,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[notes] createNote journal:", error.message);
      redirect("/notes");
    }

    await revalidateNotes();
    redirect(`/notes/${data.id}`);
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: "Untitled",
      content: "",
      type: "note",
      journal_date: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[notes] createNote:", error.message);
    redirect("/notes");
  }

  await revalidateNotes();
  redirect(`/notes/${data.id}`);
}

export async function updateNote(
  noteId: string,
  _prevState: NoteActionState | null,
  formData: FormData,
): Promise<NoteActionState> {
  const supabase = await createClient();

  const title = ((formData.get("title") as string) || "Untitled").trim();
  const content = (formData.get("content") as string) ?? "";

  const { error } = await supabase
    .from("notes")
    .update({
      title: title || "Untitled",
      content,
    })
    .eq("id", noteId);

  if (error) {
    return { error: error.message };
  }

  await revalidateNotes(noteId);
  return {};
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    console.error("[notes] deleteNote:", error.message);
    return;
  }

  await revalidateNotes();
  redirect("/notes");
}
