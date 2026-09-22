"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { toDateString } from "@/lib/date-utils";
import { buildNoteListFields } from "@/lib/note-preview";
import { createClient } from "@/lib/supabase/server";
import { HABIT_COLORS } from "@/types/habit";

export type QuickCaptureKind =
  | "task"
  | "note"
  | "journal"
  | "habit"
  | "event"
  | "book";

export type QuickCaptureResult = {
  error?: string;
  title?: string;
  href?: string;
  openLabel?: string;
};

function captureTitle(text: string, max = 100) {
  const line = text.trim().split(/\n/)[0]?.trim() || text.trim();
  if (line.length <= max) return line;
  return `${line.slice(0, max - 1)}…`;
}

function textAsNoteHtml(text: string) {
  const escaped = text
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, "<br />"))
    .filter(Boolean);
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

async function revalidateCapture(paths: string[]) {
  for (const path of paths) revalidatePath(path);
  const user = await getCurrentUser();
  if (user) revalidateUserCaches(user.id);
  else revalidatePath("/dashboard");
}

/** Create from universal Quick Capture — returns a deep link when possible. */
export async function quickCapture(
  kind: QuickCaptureKind,
  rawText: string,
): Promise<QuickCaptureResult> {
  const text = rawText.trim();
  if (!text) return { error: "Type something to capture." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const today = toDateString(new Date());
  const title = captureTitle(text);

  if (kind === "task") {
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title,
      due_date: today,
      project_id: null,
      recurrence: null,
    });
    if (error) return { error: error.message };
    await revalidateCapture(["/tasks", "/dashboard", "/search"]);
    return {
      title: "Task captured",
      href: "/tasks?view=today",
      openLabel: "Open Today",
    };
  }

  if (kind === "habit") {
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      title,
      description: null,
      color: HABIT_COLORS[0].value,
    });
    if (error) return { error: error.message };
    await revalidateCapture(["/habits", "/dashboard", "/review", "/analytics"]);
    return {
      title: "Habit added",
      href: "/habits",
      openLabel: "Open Habits",
    };
  }

  if (kind === "event") {
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title,
      description: null,
      event_date: today,
      start_time: null,
      end_time: null,
    });
    if (error) return { error: error.message };
    await revalidateCapture(["/calendar", "/dashboard", "/search"]);
    return {
      title: "Event added",
      href: "/calendar",
      openLabel: "Open Calendar",
    };
  }

  if (kind === "book") {
    const { error } = await supabase.from("books").insert({
      user_id: user.id,
      title,
      author: null,
      status: "want_to_read",
      current_page: 0,
      total_pages: null,
      rating: null,
      notes: null,
      started_at: null,
      finished_at: null,
    });
    if (error) return { error: error.message };
    await revalidateCapture(["/books", "/dashboard", "/search"]);
    return {
      title: "Book queued",
      href: "/books",
      openLabel: "Open shelf",
    };
  }

  if (kind === "journal") {
    const { data: existing } = await supabase
      .from("notes")
      .select("id, content")
      .eq("type", "journal")
      .eq("journal_date", today)
      .maybeSingle();

    const html = textAsNoteHtml(text);
    const { preview, word_count } = buildNoteListFields(html);

    if (existing) {
      const nextContent = existing.content?.trim()
        ? `${existing.content}\n${html}`
        : html;
      const fields = buildNoteListFields(nextContent);
      const { error } = await supabase
        .from("notes")
        .update({
          content: nextContent,
          preview: fields.preview,
          word_count: fields.word_count,
        })
        .eq("id", existing.id);

      if (error && /preview|word_count/i.test(error.message)) {
        const legacy = await supabase
          .from("notes")
          .update({ content: nextContent })
          .eq("id", existing.id);
        if (legacy.error) return { error: legacy.error.message };
      } else if (error) {
        return { error: error.message };
      }

      await revalidateCapture(["/notes", "/dashboard", "/search"]);
      return {
        title: "Added to today’s journal",
        href: `/notes/${existing.id}`,
        openLabel: "Open journal",
      };
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: `Journal · ${today}`,
        content: html,
        preview,
        word_count,
        type: "journal",
        journal_date: today,
      })
      .select("id")
      .single();

    if (error && /preview|word_count/i.test(error.message)) {
      const legacy = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: `Journal · ${today}`,
          content: html,
          type: "journal",
          journal_date: today,
        })
        .select("id")
        .single();
      if (legacy.error) return { error: legacy.error.message };
      await revalidateCapture(["/notes", "/dashboard", "/search"]);
      return {
        title: "Journal started",
        href: `/notes/${legacy.data.id}`,
        openLabel: "Open journal",
      };
    }

    if (error) return { error: error.message };
    await revalidateCapture(["/notes", "/dashboard", "/search"]);
    return {
      title: "Journal started",
      href: `/notes/${data.id}`,
      openLabel: "Open journal",
    };
  }

  // note
  const html = textAsNoteHtml(text);
  const { preview, word_count } = buildNoteListFields(html);
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      content: html,
      preview,
      word_count,
      type: "note",
      journal_date: null,
    })
    .select("id")
    .single();

  if (error && /preview|word_count/i.test(error.message)) {
    const legacy = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title,
        content: html,
        type: "note",
        journal_date: null,
      })
      .select("id")
      .single();
    if (legacy.error) return { error: legacy.error.message };
    await revalidateCapture(["/notes", "/dashboard", "/search"]);
    return {
      title: "Note captured",
      href: `/notes/${legacy.data.id}`,
      openLabel: "Open note",
    };
  }

  if (error) return { error: error.message };
  await revalidateCapture(["/notes", "/dashboard", "/search"]);
  return {
    title: "Note captured",
    href: `/notes/${data.id}`,
    openLabel: "Open note",
  };
}
