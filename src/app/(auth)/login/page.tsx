import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to IMX OS",
};

export default function LoginPage() {
  return <LoginForm />;
}
