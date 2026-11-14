"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function NavPendingDot({ collapsed }: { collapsed?: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full bg-sidebar-foreground/45 transition-opacity duration-150",
        collapsed ? "absolute right-1 top-1" : "ml-auto",
        pending ? "animate-pulse opacity-100 delay-75" : "opacity-0",
      )}
    />
  );
}

type NavLinkProps = {
  href: string;
  isActive: boolean;
  onNavigate?: () => void;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
};

/**
 * Standard sidebar item — icon + label, soft active fill (Linear / Notion / Todoist).
 * A11y polish set: `layout/sidebar.tsx`, search/books/notes filter labels,
 * habit check `aria-hidden`, decorative search arrows.
 */
export function NavLink({
  href,
  isActive,
  onNavigate,
  icon: Icon,
  label,
  collapsed = false,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      prefetch
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "group/nav relative flex items-center outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed
          ? "mx-auto size-8 justify-center rounded-md"
          : "h-8 gap-2 rounded-md px-2 text-[13px]",
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          isActive ? "opacity-100" : "opacity-70",
        )}
        strokeWidth={isActive ? 2.1 : 1.85}
      />
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate leading-none">{label}</span>
      ) : null}
      <NavPendingDot collapsed={collapsed} />
    </Link>
  );
}
