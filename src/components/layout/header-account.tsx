"use client";

import { AccountMenu } from "@/components/layout/account-menu";
import { cn } from "@/lib/utils";

type HeaderAccountProps = {
  className?: string;
};

/** Header account control — avatar opens Settings / Theme / Sign out. */
export function HeaderAccount({ className }: HeaderAccountProps) {
  return <AccountMenu variant="header" className={cn(className)} />;
}
