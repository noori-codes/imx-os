/** Encode Focus time-boxes in calendar event descriptions without a DB migration. */

export const FOCUS_BLOCK_MARKER = "imx:focus";

export function encodeFocusBlock(taskId?: string | null): string {
  const id = taskId?.trim();
  return id ? `${FOCUS_BLOCK_MARKER}:${id}` : FOCUS_BLOCK_MARKER;
}

export function parseFocusBlock(description: string | null | undefined): {
  isFocusBlock: boolean;
  taskId: string | null;
} {
  if (!description) return { isFocusBlock: false, taskId: null };
  const line = description
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.startsWith(FOCUS_BLOCK_MARKER));
  if (!line) return { isFocusBlock: false, taskId: null };
  const rest = line.slice(FOCUS_BLOCK_MARKER.length);
  if (rest.startsWith(":")) {
    const taskId = rest.slice(1).trim();
    return { isFocusBlock: true, taskId: taskId || null };
  }
  return { isFocusBlock: true, taskId: null };
}

export function focusHrefFromBlock(description: string | null | undefined): string | null {
  const parsed = parseFocusBlock(description);
  if (!parsed.isFocusBlock) return null;
  return parsed.taskId ? `/focus?task=${encodeURIComponent(parsed.taskId)}` : "/focus";
}

/** Next quarter-hour local start, plus duration minutes → HH:MM strings. */
export function defaultFocusBlockTimes(
  durationMinutes = 25,
  now = new Date(),
): { start: string; end: string } {
  const start = new Date(now);
  start.setSeconds(0, 0);
  const minutes = start.getMinutes();
  const bump = minutes % 15 === 0 ? 0 : 15 - (minutes % 15);
  start.setMinutes(minutes + bump);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}
