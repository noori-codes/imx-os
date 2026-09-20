import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { friendlyAuthError } from "@/lib/auth-messages";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to IMX OS",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

function resolveAuthPageError(
  error?: string,
  message?: string,
): string | null {
  if (message?.trim()) {
    return friendlyAuthError(message);
  }
  if (error === "auth_callback_failed" || error === "oauth") {
    return "Social sign-in didn’t finish. Try again, or use email.";
  }
  if (error) {
    return friendlyAuthError(error);
  }
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackError = resolveAuthPageError(params.error, params.message);

  return <LoginForm callbackError={callbackError} />;
}
