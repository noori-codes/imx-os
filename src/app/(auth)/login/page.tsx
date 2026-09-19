import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to IMX OS",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const callbackError =
    error === "auth_callback_failed"
      ? "Social sign-in didn’t finish. Try again, or use email."
      : null;

  return <LoginForm callbackError={callbackError} />;
}
