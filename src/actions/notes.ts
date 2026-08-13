"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toDateString } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type { Note, NoteType } from "@/types/note";

export type NoteActionState = {
  error?: string;
};

function revalidateNotes(noteId?: string) {
  revalidatePath("/notes");
  revalidatePath("/calendar");
  if (noteId) {
    revalidatePath(`/notes/${noteId}`);
  }
}

export async function getNotes(type?: NoteType): Promise<Note[]> {
  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

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

export async function getNote(noteId: string): Promise<Note | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .single();

  if (error) {
    console.error("[notes] getNote:", error.message);
    return null;
  }

  return data;
}

export async function getTodayJournal(): Promise<Note | null> {
  const supabase = await createClient();
  const today = toDateString(new Date());

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("type", "journal")
    .eq("journal_date", today)
    .maybeSingle();

  if (error) {
    console.error("[notes] getTodayJournal:", error.message);
    return null;
  }

  return data;
}

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

    revalidateNotes();
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

  revalidateNotes();
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

  revalidateNotes(noteId);
  return {};
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    console.error("[notes] deleteNote:", error.message);
    return;
  }

  revalidateNotes();
  redirect("/notes");
}
