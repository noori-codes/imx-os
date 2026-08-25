"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { NavLink } from "@/components/layout/nav-link";
import { NAV_GROUPS, NAV_SETTINGS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

type SidebarProps = {
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const settingsActive = isActivePath(pathname, NAV_SETTINGS.href);
  const SettingsIcon = NAV_SETTINGS.icon;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          prefetch
          className="group/brand flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-sidebar-border bg-black dark:border-white/10">
            <Image
              src="/IMX-logo.png"
              alt="IMX"
              fill
              priority
              sizes="32px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-sidebar-foreground">
              IMX OS
            </span>
            <span className="block text-[9px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/45">
              Personal OS
            </span>
          </span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/40">
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
                      <Icon className="size-4 shrink-0 opacity-80" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="shrink-0 space-y-0.5 border-t border-sidebar-border p-3 pb-4">
        <NavLink
          href={NAV_SETTINGS.href}
          isActive={settingsActive}
          onNavigate={onNavigate}
        >
          <SettingsIcon className="size-4 shrink-0 opacity-80" />
          <span>{NAV_SETTINGS.title}</span>
        </NavLink>
        <SignOutButton className="h-9 w-full justify-start gap-3 rounded-lg px-3 text-sm font-normal text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground" />
      </div>
    </aside>
  );
}
