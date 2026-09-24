"use client";

import { UserAvatar } from "@/components/layout/user-avatar";
import { useUser } from "@/components/providers/user-provider";
import { cn } from "@/lib/utils";

type HeaderAccountProps = {
  className?: string;
};

/**
 * Step 1 — avatar in the header chrome.
 * Menu (Settings / Theme / Sign out) lands in the next step.
 */
export function HeaderAccount({ className }: HeaderAccountProps) {
  const { name, email } = useUser();
  const label = email ? `Account · ${name} (${email})` : `Account · ${name}`;

  return (
    <button
      type="button"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <UserAvatar size={32} />
    </button>
  );
}
