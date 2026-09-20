import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { friendlyAuthError } from "@/lib/auth-messages";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your IMX OS account",
};

type RegisterPageProps = {
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

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const callbackError = resolveAuthPageError(params.error, params.message);

  return <RegisterForm callbackError={callbackError} />;
}
