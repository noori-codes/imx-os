"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { NavLink } from "@/components/layout/nav-link";
import { useUser } from "@/components/providers/user-provider";
import { NAV_GROUPS, NAV_SETTINGS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
        <nav className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      isActive={isActivePath(pathname, item.href)}
                      onNavigate={onNavigate}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Account
            </p>
            <div className="flex flex-col gap-0.5">
              <NavLink
                href={NAV_SETTINGS.href}
                isActive={isActivePath(pathname, NAV_SETTINGS.href)}
                onNavigate={onNavigate}
              >
                <NAV_SETTINGS.icon className="size-4 shrink-0" />
                <span>{NAV_SETTINGS.title}</span>
              </NavLink>
            </div>
          </div>
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
