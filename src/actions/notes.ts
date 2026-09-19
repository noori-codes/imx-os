"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { CACHE_TTL, cacheTags, cachedQuery, revalidateUserCaches } from "@/lib/cache";
import { toDateString } from "@/lib/date-utils";
import { buildNoteListFields } from "@/lib/note-preview";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Note, NoteListItem, NoteType } from "@/types/note";

export type NoteActionState = {
  error?: string;
};

type QueryClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

const NOTES_LIST_SELECT =
  "id, user_id, title, type, journal_date, created_at, updated_at, preview, word_count";

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

function mapListItem(row: {
  id: string;
  user_id: string;
  title: string;
  type: NoteType;
  journal_date: string | null;
  created_at: string;
  updated_at: string;
  preview?: string | null;
  word_count?: number | null;
}): NoteListItem {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    type: row.type,
    journal_date: row.journal_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    preview: row.preview ?? "",
    word_count: row.word_count ?? 0,
  };
}

async function loadNotes(
  userId: string | null,
  type?: NoteType,
): Promise<NoteListItem[]> {
  const supabase = await notesClient(userId);

  let query = supabase
    .from("notes")
    .select(NOTES_LIST_SELECT)
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

  return (data ?? []).map(mapListItem);
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

async function loadTodayJournal(
  userId: string | null,
): Promise<NoteListItem | null> {
  const supabase = await notesClient(userId);
  const today = toDateString(new Date());

  let query = supabase
    .from("notes")
    .select(NOTES_LIST_SELECT)
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

  return data ? mapListItem(data) : null;
}

/** Notes list — request memoized; cross-request cached when service role is set. */
export const getNotes = cache(async (type?: NoteType): Promise<NoteListItem[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  if (hasAdminClient()) {
    return cachedQuery(
      ["notes", user.id, type ?? "all", "list-v2"],
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

/** Today's journal (list fields only) — for spotlight / existence checks. */
export const getTodayJournal = cache(async (): Promise<NoteListItem | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const today = toDateString(new Date());

  if (hasAdminClient()) {
    return cachedQuery(
      ["notes", user.id, "journal", today, "list-v2"],
      [cacheTags.notes(user.id)],
      CACHE_TTL.notes,
      async () => loadTodayJournal(user.id),
    )();
  }

  return loadTodayJournal(null);
});

export async function createNote(
  type: NoteType = "note",
  journalDateOrFormData?: string | FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = toDateString(new Date());
  const journalDate =
    typeof journalDateOrFormData === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(journalDateOrFormData)
      ? journalDateOrFormData
      : undefined;
  const day = type === "journal" ? (journalDate ?? today) : today;

  if (type === "journal") {
    const { data: existing } = await supabase
      .from("notes")
      .select("id")
      .eq("type", "journal")
      .eq("journal_date", day)
      .maybeSingle();

    if (existing) {
      redirect(`/notes/${existing.id}`);
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: `Journal · ${day}`,
        content: "",
        type: "journal",
        journal_date: day,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[notes] createNote journal:", error.message);
      redirect("/notes?error=create_failed");
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
    redirect("/notes?error=create_failed");
  }

  await revalidateNotes();
  redirect(`/notes/${data.id}`);
}

/** Form action — new plain note (no .bind needed). */
export async function createPlainNoteAction() {
  await createNote("note");
}

/** Form action — today's journal, or `journal_date` hidden field (YYYY-MM-DD). */
export async function createJournalNoteAction(formData?: FormData) {
  const raw = formData?.get("journal_date");
  const journalDate =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  await createNote("journal", journalDate);
}

export async function updateNote(
  noteId: string,
  _prevState: NoteActionState | null,
  formData: FormData,
): Promise<NoteActionState> {
  const supabase = await createClient();

  const title = ((formData.get("title") as string) || "Untitled").trim();
  const content = (formData.get("content") as string) ?? "";
  const { preview, word_count } = buildNoteListFields(content);

  const { error } = await supabase
    .from("notes")
    .update({
      title: title || "Untitled",
      content,
      preview,
      word_count,
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
