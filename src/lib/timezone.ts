import { cookies } from "next/headers";

/** Cookie set by the client with the browser IANA timezone (e.g. Asia/Tehran). */
export const TIMEZONE_COOKIE = "imx-tz";

const TZ_RE = /^[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)*$/;

export function isValidTimeZone(value: string) {
  if (!TZ_RE.test(value) || value.length > 64) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Calendar YYYY-MM-DD for `date` in an IANA timezone. */
export function toDateStringInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return `${year}-${month}-${day}`;
}

/** Hour 0–23 in an IANA timezone. */
export function getHourInZone(date: Date, timeZone: string) {
  const hourRaw = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(hourRaw.find((p) => p.type === "hour")?.value ?? NaN);
  return Number.isFinite(hour) ? hour : date.getHours();
}

/**
 * Convert a wall-clock date/time in `timeZone` to a UTC Date.
 * `dateStr` is YYYY-MM-DD.
 */
export function zonedTimeToUtc(
  dateStr: string,
  timeZone: string,
  hours = 0,
  minutes = 0,
  seconds = 0,
) {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  const utcGuess = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds),
  );

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utcGuess);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  const asUtcMs = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  const offset = asUtcMs - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offset);
}

/** Inclusive start / exclusive end of a calendar day in `timeZone`. */
export function zonedDayBounds(dateStr: string, timeZone: string) {
  const start = zonedTimeToUtc(dateStr, timeZone, 0, 0, 0);
  const next = new Date(`${dateStr}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextStr = next.toISOString().slice(0, 10);
  const end = zonedTimeToUtc(nextStr, timeZone, 0, 0, 0);
  return { start, end };
}

/** Read the request’s timezone cookie (server only). */
export async function getRequestTimeZone(): Promise<string | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(TIMEZONE_COOKIE)?.value;
    if (!raw) return null;
    const decoded = decodeURIComponent(raw);
    return isValidTimeZone(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * “Today” as YYYY-MM-DD in the user’s timezone when known,
 * otherwise the runtime’s local calendar day.
 */
export async function getTodayString(now = new Date()) {
  const timeZone = await getRequestTimeZone();
  if (timeZone) return toDateStringInZone(now, timeZone);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
