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
        "ml-auto size-1.5 shrink-0 rounded-full bg-foreground/50 transition-opacity duration-150",
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
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "font-normal text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-foreground transition-opacity duration-150",
          isActive ? "opacity-100" : "opacity-0 group-hover/nav:opacity-25",
        )}
      />
      {children}
      <NavPendingDot />
    </Link>
  );
}
