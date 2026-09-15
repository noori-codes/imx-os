import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link for IMX OS",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
