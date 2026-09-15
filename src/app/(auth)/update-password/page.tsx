import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "New password",
  description: "Choose a new password for IMX OS",
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
