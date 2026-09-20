"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  friendlyAuthError,
  isValidEmail,
  normalizeEmail,
  normalizePassword,
  validatePassword,
} from "@/lib/auth-messages";
import { getOAuthRedirectOrigin, getSiteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
};

export async function login(
  _prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!password) {
    return { error: "Password is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const confirmPassword = normalizePassword(formData.get("confirmPassword"));

  if (!email || !isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  // Prefer live host so confirm links match the app the user signed up on.
  const origin =
    (await getOAuthRedirectOrigin().catch(() => null)) ?? getSiteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  // Supabase returns an empty identities list when the email is already taken
  // (and "Confirm email" is on) — treat that as a clear conflict.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      error: "An account with this email already exists. Sign in instead.",
    };
  }

  // Email confirmation disabled → session is created immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    success:
      "Account created! Check your email to confirm, then sign in.",
  };
}

export async function requestPasswordReset(
  _prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));

  if (!email || !isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const origin =
    (await getOAuthRedirectOrigin().catch(() => null)) ?? getSiteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/update-password")}`,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  return {
    success:
      "If an account exists for that email, you’ll get a reset link shortly.",
  };
}

export async function updatePassword(
  _prevState: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset link expired. Request a new one." };
  }

  const password = normalizePassword(formData.get("password"));
  const confirmPassword = normalizePassword(formData.get("confirmPassword"));

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export type OAuthProvider = "google" | "github";

export async function signInWithOAuthProvider(
  provider: OAuthProvider,
): Promise<AuthState> {
  if (provider !== "google" && provider !== "github") {
    return { error: "Unsupported sign-in provider." };
  }

  const supabase = await createClient();
  const origin = await getOAuthRedirectOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  if (!data.url) {
    return { error: "Couldn’t start social sign-in. Try again." };
  }

  redirect(data.url);
}
