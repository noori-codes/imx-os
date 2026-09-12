"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { revalidateUserCaches } from "@/lib/cache";
import { toDateString } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type { Book, BookStatus } from "@/types/book";

export type BookActionState = {
  error?: string;
};

const BOOKS_PATH = "/books";

const VALID_STATUSES = new Set<BookStatus>([
  "want_to_read",
  "reading",
  "finished",
  "abandoned",
]);

async function revalidateBooks() {
  revalidatePath(BOOKS_PATH);
  revalidatePath("/search");
  const user = await getCurrentUser();
  if (user) {
    revalidateUserCaches(user.id);
  }
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalRating(value: FormDataEntryValue | null): number | null {
  const n = parseOptionalInt(value);
  if (n == null) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

function parseStatus(value: FormDataEntryValue | null): BookStatus {
  const raw = String(value ?? "want_to_read");
  return VALID_STATUSES.has(raw as BookStatus)
    ? (raw as BookStatus)
    : "want_to_read";
}

function statusPatch(
  status: BookStatus,
  current: Pick<Book, "started_at" | "finished_at" | "current_page" | "total_pages">,
): Partial<Book> {
  const today = toDateString(new Date());
  const patch: Partial<Book> = { status };

  if (status === "reading") {
    patch.finished_at = null;
    if (!current.started_at) patch.started_at = today;
  }

  if (status === "finished") {
    patch.finished_at = today;
    if (!current.started_at) patch.started_at = today;
    if (current.total_pages != null) {
      patch.current_page = current.total_pages;
    }
  }

  if (status === "want_to_read") {
    patch.finished_at = null;
  }

  if (status === "abandoned") {
    patch.finished_at = null;
  }

  return patch;
}

export async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[books] getBooks:", error.message);
    return [];
  }

  return (data ?? []) as Book[];
}

export async function createBook(
  _prev: BookActionState | null,
  formData: FormData,
): Promise<BookActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const title = ((formData.get("title") as string) || "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const author = ((formData.get("author") as string) || "").trim() || null;
  const status = parseStatus(formData.get("status"));
  const totalPages = parseOptionalInt(formData.get("total_pages"));
  let currentPage = parseOptionalInt(formData.get("current_page")) ?? 0;
  const rating = parseOptionalRating(formData.get("rating"));
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  if (totalPages != null && currentPage > totalPages) {
    currentPage = totalPages;
  }

  const base = {
    started_at: null as string | null,
    finished_at: null as string | null,
    current_page: currentPage,
    total_pages: totalPages,
  };
  const patch = statusPatch(status, base);

  const { error } = await supabase.from("books").insert({
    user_id: user.id,
    title,
    author,
    status,
    current_page: patch.current_page ?? currentPage,
    total_pages: totalPages,
    rating,
    notes,
    started_at: patch.started_at ?? null,
    finished_at: patch.finished_at ?? null,
  });

  if (error) {
    console.error("[books] createBook:", error.message);
    return { error: error.message };
  }

  await revalidateBooks();
  return {};
}

export async function updateBook(
  bookId: string,
  _prev: BookActionState | null,
  formData: FormData,
): Promise<BookActionState> {
  const supabase = await createClient();

  const title = ((formData.get("title") as string) || "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const { data: existing, error: loadError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (loadError || !existing) {
    return { error: loadError?.message ?? "Book not found." };
  }

  const author = ((formData.get("author") as string) || "").trim() || null;
  const status = parseStatus(formData.get("status"));
  const totalPages = parseOptionalInt(formData.get("total_pages"));
  let currentPage = parseOptionalInt(formData.get("current_page")) ?? 0;
  const rating = parseOptionalRating(formData.get("rating"));
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  if (totalPages != null && currentPage > totalPages) {
    currentPage = totalPages;
  }

  const patch = statusPatch(status, {
    started_at: existing.started_at,
    finished_at: existing.finished_at,
    current_page: currentPage,
    total_pages: totalPages,
  });

  const { error } = await supabase
    .from("books")
    .update({
      title,
      author,
      status,
      current_page: patch.current_page ?? currentPage,
      total_pages: totalPages,
      rating,
      notes,
      started_at:
        patch.started_at !== undefined
          ? patch.started_at
          : existing.started_at,
      finished_at:
        patch.finished_at !== undefined
          ? patch.finished_at
          : existing.finished_at,
    })
    .eq("id", bookId);

  if (error) {
    console.error("[books] updateBook:", error.message);
    return { error: error.message };
  }

  await revalidateBooks();
  return {};
}

export async function updateBookStatus(bookId: string, status: BookStatus) {
  if (!VALID_STATUSES.has(status)) return;

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (loadError || !existing) {
    console.error("[books] updateBookStatus:", loadError?.message);
    return;
  }

  const patch = statusPatch(status, existing as Book);

  const { error } = await supabase
    .from("books")
    .update({
      status,
      current_page: patch.current_page ?? existing.current_page,
      started_at:
        patch.started_at !== undefined
          ? patch.started_at
          : existing.started_at,
      finished_at:
        patch.finished_at !== undefined
          ? patch.finished_at
          : existing.finished_at,
    })
    .eq("id", bookId);

  if (error) {
    console.error("[books] updateBookStatus:", error.message);
    return;
  }

  await revalidateBooks();
}

export async function updateBookProgress(bookId: string, currentPage: number) {
  const page = Math.max(0, Math.floor(currentPage));
  const supabase = await createClient();

  const { data: existing, error: loadError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (loadError || !existing) {
    console.error("[books] updateBookProgress:", loadError?.message);
    return;
  }

  let nextPage = page;
  if (existing.total_pages != null) {
    nextPage = Math.min(page, existing.total_pages);
  }

  const updates: Record<string, unknown> = {
    current_page: nextPage,
  };

  if (
    existing.status === "want_to_read" ||
    (existing.status !== "finished" &&
      existing.status !== "abandoned" &&
      nextPage > 0)
  ) {
    if (existing.status !== "reading" && existing.status !== "finished") {
      updates.status = "reading";
    }
    if (!existing.started_at) {
      updates.started_at = toDateString(new Date());
    }
  }

  if (
    existing.total_pages != null &&
    nextPage >= existing.total_pages &&
    existing.total_pages > 0
  ) {
    updates.status = "finished";
    updates.finished_at = toDateString(new Date());
    updates.current_page = existing.total_pages;
  }

  const { error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", bookId);

  if (error) {
    console.error("[books] updateBookProgress:", error.message);
    return;
  }

  await revalidateBooks();
}

export async function deleteBook(bookId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", bookId);

  if (error) {
    console.error("[books] deleteBook:", error.message);
    return;
  }

  await revalidateBooks();
}
