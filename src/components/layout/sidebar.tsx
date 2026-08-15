"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { NavLink } from "@/components/layout/nav-link";
import { useUser } from "@/components/providers/user-provider";
import { NAV_ITEMS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { email } = useUser();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={onNavigate}
          prefetch
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            IM
          </span>
          <span>IMX OS</span>
        </Link>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                href={item.href}
                isActive={isActive}
                onNavigate={onNavigate}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="space-y-3 p-4">
        {email ? (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        ) : null}
        <SignOutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
