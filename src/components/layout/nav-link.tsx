"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

function NavPendingDot() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto size-1.5 shrink-0 rounded-full bg-primary transition-opacity duration-150",
        pending ? "animate-pulse opacity-100 delay-100" : "opacity-0",
      )}
    />
  );
}

type NavLinkProps = {
  href: string;
  isActive: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
};

export function NavLink({ href, isActive, onNavigate, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      prefetch
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {children}
      <NavPendingDot />
    </Link>
  );
}
