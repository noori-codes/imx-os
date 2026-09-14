/** Allowed coach suggestion destinations — keep in sync with SYSTEM_PROMPT. */
export const COACH_ACTION_HREFS = [
  "/dashboard",
  "/tasks",
  "/tasks?view=today",
  "/tasks?view=week",
  "/tasks?compose=1",
  "/focus",
  "/habits",
  "/notes",
  "/review",
  "/goals",
  "/calendar",
  "/analytics",
] as const;

export type CoachActionHref = (typeof COACH_ACTION_HREFS)[number];

export type CoachSuggestion = {
  text: string;
  href: CoachActionHref | null;
};

const HREF_SET = new Set<string>(COACH_ACTION_HREFS);

export function isCoachActionHref(value: string): value is CoachActionHref {
  return HREF_SET.has(value);
}

/** Short CTA chip for a known destination. */
export function coachActionLabel(href: CoachActionHref): string {
  switch (href) {
    case "/dashboard":
      return "Dashboard";
    case "/tasks":
      return "Tasks";
    case "/tasks?view=today":
      return "Today";
    case "/tasks?view=week":
      return "This week";
    case "/tasks?compose=1":
      return "Add task";
    case "/focus":
      return "Focus";
    case "/habits":
      return "Habits";
    case "/notes":
      return "Notes";
    case "/review":
      return "Review";
    case "/goals":
      return "Goals";
    case "/calendar":
      return "Calendar";
    case "/analytics":
      return "Analytics";
  }
}

/** Infer a destination when the model returns plain text only. */
export function inferCoachHref(text: string): CoachActionHref | null {
  const t = text.toLowerCase();
  if (/add (a )?task|capture|new task/.test(t)) return "/tasks?compose=1";
  if (/overdue|due today|clear .*task|inbox|todo/.test(t)) {
    return "/tasks?view=today";
  }
  if (/this week|upcoming task/.test(t)) return "/tasks?view=week";
  if (/task/.test(t)) return "/tasks";
  if (/focus|pomodoro|timer|deep work|block/.test(t)) return "/focus";
  if (/review|reflect|tomorrow.?focus|wind.?down/.test(t)) return "/review";
  if (/habit|streak|check.?in|ritual/.test(t)) return "/habits";
  if (/journal|note|writ(e|ing)/.test(t)) return "/notes";
  if (/goal|project/.test(t)) return "/goals";
  if (/calendar|schedule|event/.test(t)) return "/calendar";
  if (/analytics|chart|trend/.test(t)) return "/analytics";
  if (/dashboard|overview/.test(t)) return "/dashboard";
  return null;
}

export function normalizeCoachSuggestion(raw: unknown): CoachSuggestion | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    return { text, href: inferCoachHref(text) };
  }

  if (!raw || typeof raw !== "object") return null;
  const row = raw as { text?: unknown; href?: unknown; tip?: unknown };
  const text =
    typeof row.text === "string"
      ? row.text.trim()
      : typeof row.tip === "string"
        ? row.tip.trim()
        : "";
  if (!text) return null;

  let href: CoachActionHref | null = null;
  if (typeof row.href === "string" && isCoachActionHref(row.href)) {
    href = row.href;
  } else {
    href = inferCoachHref(text);
  }

  return { text, href };
}

export function normalizeCoachSuggestions(
  raw: unknown,
  fallbackTexts: string[],
): CoachSuggestion[] {
  const fromModel = Array.isArray(raw)
    ? raw
        .map(normalizeCoachSuggestion)
        .filter((item): item is CoachSuggestion => item != null)
        .slice(0, 3)
    : [];

  if (fromModel.length > 0) return fromModel;

  return fallbackTexts
    .map(normalizeCoachSuggestion)
    .filter((item): item is CoachSuggestion => item != null)
    .slice(0, 3);
}

export const DEFAULT_COACH_SUGGESTION_TEXTS = [
  "Protect one short focus block tomorrow.",
  "Clear one overdue task.",
  "Log tonight’s daily review.",
] as const;
