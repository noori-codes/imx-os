"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  variant?: "ghost" | "outline";
  className?: string;
};

function SignOutSubmit({
  variant,
  className,
}: {
  variant: "ghost" | "outline";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size="sm"
      className={className}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export function SignOutButton({
  variant = "ghost",
  className,
}: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <SignOutSubmit variant={variant} className={className} />
    </form>
  );
}
