import { LogOut } from "lucide-react";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  variant?: "ghost" | "outline";
  className?: string;
};

export function SignOutButton({
  variant = "ghost",
  className,
}: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant={variant}
        size="sm"
        className={className}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
