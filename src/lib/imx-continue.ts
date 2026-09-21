/** Last-place continue pointer — local, per browser. */

export type ImxContinuePointer = {
  kind: "focus" | "task" | "note";
  label: string;
  href: string;
  at: number;
};

const KEY = "imx-continue-v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 36; // ~1.5 days

export function readContinuePointer(): ImxContinuePointer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImxContinuePointer;
    if (
      !parsed?.href ||
      !parsed?.label ||
      !parsed?.at ||
      Date.now() - parsed.at > MAX_AGE_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeContinuePointer(
  pointer: Omit<ImxContinuePointer, "at">,
) {
  if (typeof window === "undefined") return;
  try {
    const next: ImxContinuePointer = { ...pointer, at: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("imx:continue-updated"));
  } catch {
    // ignore quota / private mode
  }
}

export function clearContinuePointer() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("imx:continue-updated"));
  } catch {
    // ignore
  }
}
