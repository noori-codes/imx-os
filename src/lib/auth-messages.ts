/** Shared auth form validation + human-readable Supabase errors. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}

export function normalizePassword(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw;
}

export function isValidEmail(email: string): boolean {
  return email.length > 3 && email.length <= 254 && EMAIL_RE.test(email);
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 72) return "Password must be 72 characters or fewer.";
  return null;
}

/** Map Supabase / OAuth errors to short UI copy. */
export function friendlyAuthError(raw: string | null | undefined): string {
  const message = (raw ?? "").trim();
  if (!message) return "Something went wrong. Try again.";

  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for the link.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Network error. Check your connection and try again.";
  }
  if (lower.includes("redirect_uri") || lower.includes("redirect")) {
    return "Sign-in redirect isn’t configured. Try email, or contact support.";
  }
  if (lower.includes("access_denied") || lower.includes("user cancelled")) {
    return "Sign-in was cancelled.";
  }
  if (lower.includes("oauth") && lower.includes("provider")) {
    return "Social sign-in isn’t available right now. Try email.";
  }

  // Avoid dumping long provider dumps into the UI.
  if (message.length > 160) {
    return "Couldn’t complete sign-in. Try again, or use email.";
  }

  return message;
}
