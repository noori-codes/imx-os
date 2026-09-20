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

export type AuthFeedbackDetail = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
};

/** Map Supabase / OAuth errors to short UI copy. */
export function friendlyAuthError(raw: string | null | undefined): string {
  return describeAuthError(raw).body;
}

/** Richer feedback for auth banners (title + body + optional CTA). */
export function describeAuthError(
  raw: string | null | undefined,
): AuthFeedbackDetail {
  const message = (raw ?? "").trim();
  if (!message) {
    return {
      title: "Something went wrong",
      body: "Try again in a moment.",
    };
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("email or password is incorrect")
  ) {
    return {
      title: "Couldn’t sign in",
      body: "Email or password is incorrect. Double-check both and try again.",
      href: "/forgot-password",
      hrefLabel: "Reset password",
    };
  }

  if (
    lower.includes("email not confirmed") ||
    lower.includes("confirm your email")
  ) {
    return {
      title: "Confirm your email",
      body: "Open the confirmation link we sent, then come back to sign in.",
    };
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("already exists")
  ) {
    return {
      title: "Account already exists",
      body: "This email is already registered. Sign in, or reset your password.",
      href: "/login",
      hrefLabel: "Go to sign in",
    };
  }

  if (lower.includes("passwords do not match")) {
    return {
      title: "Passwords don’t match",
      body: "Re-enter the same password in both fields.",
    };
  }

  if (lower.includes("at least 8") || lower.includes("password must be")) {
    return {
      title: "Password too short",
      body: "Use at least 8 characters for a stronger password.",
    };
  }

  if (lower.includes("valid email") || lower.includes("email is required")) {
    return {
      title: "Email needed",
      body: "Enter a valid email address to continue.",
    };
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return {
      title: "Slow down",
      body: "Too many attempts. Wait a minute, then try again.",
    };
  }

  if (lower.includes("network") || lower.includes("fetch failed")) {
    return {
      title: "Connection problem",
      body: "Check your internet connection and try again.",
    };
  }

  if (lower.includes("redirect")) {
    return {
      title: "Sign-in misconfigured",
      body: "Social redirect isn’t set up correctly. Try email for now.",
    };
  }

  if (
    lower.includes("access_denied") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  ) {
    return {
      title: "Sign-in cancelled",
      body: "No worries — you can try Google, GitHub, or email again.",
    };
  }

  if (
    lower.includes("social sign-in") ||
    lower.includes("didn’t finish") ||
    lower.includes("oauth")
  ) {
    return {
      title: "Social sign-in failed",
      body: "That didn’t complete. Try again, or use email instead.",
    };
  }

  if (lower.includes("expired") || lower.includes("invalid token")) {
    return {
      title: "Link expired",
      body: "This reset link is no longer valid. Request a fresh one.",
      href: "/forgot-password",
      hrefLabel: "Request a new link",
    };
  }

  if (message.length > 160) {
    return {
      title: "Couldn’t complete that",
      body: "Try again, or use email and password.",
    };
  }

  return {
    title: "Couldn’t continue",
    body: message,
  };
}

export function describeAuthSuccess(
  raw: string | null | undefined,
): AuthFeedbackDetail {
  const message = (raw ?? "").trim();
  const lower = message.toLowerCase();

  if (lower.includes("check your email") || lower.includes("confirm")) {
    return {
      title: "Check your inbox",
      body: "We sent a confirmation link. Confirm your email, then sign in.",
      href: "/login",
      hrefLabel: "Go to sign in",
    };
  }

  if (lower.includes("reset link") || lower.includes("exists for that email")) {
    return {
      title: "Email on the way",
      body: "If an account exists for that address, you’ll get a reset link shortly.",
      href: "/login",
      hrefLabel: "Back to sign in",
    };
  }

  return {
    title: "You’re set",
    body: message || "All done.",
  };
}
