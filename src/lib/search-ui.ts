import {
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  ListTodo,
  Target,
  type LucideIcon,
} from "lucide-react";

import type { SearchEntityType } from "@/types/search";

export const SEARCH_ENTITY_ORDER: SearchEntityType[] = [
  "task",
  "goal",
  "project",
  "note",
  "habit",
  "event",
  "book",
];

export const SEARCH_ENTITY_META: Record<
  SearchEntityType,
  { label: string; plural: string; icon: LucideIcon }
> = {
  task: { label: "Task", plural: "Tasks", icon: ListTodo },
  goal: { label: "Goal", plural: "Goals", icon: Target },
  project: { label: "Project", plural: "Projects", icon: FolderKanban },
  note: { label: "Note", plural: "Notes", icon: FileText },
  habit: { label: "Habit", plural: "Habits", icon: CheckSquare },
  event: { label: "Event", plural: "Events", icon: Calendar },
  book: { label: "Book", plural: "Books", icon: BookOpen },
};

export const SEARCH_JUMP_LINKS = [
  { label: "Dashboard", href: "/dashboard", hint: "Today’s overview" },
  { label: "Tasks", href: "/tasks", hint: "Inbox & schedule" },
  { label: "Focus", href: "/focus", hint: "Timer" },
  { label: "Notes", href: "/notes", hint: "Library" },
  { label: "Habits", href: "/habits", hint: "Check-ins" },
  { label: "Review", href: "/review", hint: "Reflect" },
] as const;

const RECENT_KEY = "imx-search-recent";
const RECENT_MAX = 8;

export function parseSearchEntityType(
  value: string | undefined | null,
): SearchEntityType | "all" {
  if (!value || value === "all") return "all";
  if ((SEARCH_ENTITY_ORDER as string[]).includes(value)) {
    return value as SearchEntityType;
  }
  return "all";
}

/** Highlight case-insensitive query matches inside plain text. */
export type HighlightPart =
  | { type: "mark"; value: string; key: number }
  | { type: "text"; value: string; key: number };

export function getHighlightParts(text: string, query: string): HighlightPart[] {
  const q = query.trim();
  if (!q || q.length < 2) {
    return [{ type: "text", value: text, key: 0 }];
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(re);

  return parts.map((part, index) =>
    part.toLowerCase() === q.toLowerCase()
      ? { type: "mark" as const, value: part, key: index }
      : { type: "text" as const, value: part, key: index },
  );
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length >= 2)
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const q = query.trim();
  if (q.length < 2) return;
  const next = [q, ...readRecentSearches().filter((item) => item !== q)].slice(
    0,
    RECENT_MAX,
  );
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECENT_KEY);
}
