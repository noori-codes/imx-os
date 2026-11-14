"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, PanelLeftClose, Settings } from "lucide-react";

import { AccountMenu } from "@/components/layout/account-menu";
import { NavLink } from "@/components/layout/nav-link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NAV_GROUPS, NAV_SETTINGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "imx-sidebar-collapsed";

type SidebarProps = {
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop sidebar — standard productivity chrome:
 * workspace top → grouped places → settings/account bottom.
 * Matches Linear / Notion / Todoist hierarchy (not a custom command dock).
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.sidebarCollapsed = collapsed
      ? "true"
      : "false";
  }, [collapsed, hydrated]);

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "imx-sidebar relative flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh",
        collapsed ? "w-14" : "w-60",
        "transition-[width] duration-200 ease-out",
      )}
    >
      {/* Workspace header */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-1",
          collapsed
            ? "flex-col px-1.5 pt-2.5 pb-1"
            : "h-12 justify-between px-3",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          prefetch
          className={cn(
            "flex min-w-0 items-center outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed ? "rounded-md p-1" : "gap-2 rounded-md",
          )}
          aria-label="IMX OS"
        >
          <span className="relative size-6 shrink-0 overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent">
            <Image
              src="/imx-logo-64.png"
              alt=""
              fill
              priority
              sizes="24px"
              className="object-cover"
            />
          </span>
          {!collapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight">
              IMX OS
            </span>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/40 outline-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-3.5" strokeWidth={1.75} aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className={cn("flex-1", collapsed ? "px-1.5 pt-1" : "px-2 py-1")}>
        <nav className="flex flex-col gap-4 pb-3" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              {!collapsed ? (
                <p className="mb-1 px-2 text-[11px] font-medium text-sidebar-foreground/40">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.title}
                  isActive={isActivePath(pathname, item.href)}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer — settings + account (standard bottom dock) */}
      <div
        className={cn(
          "mt-auto shrink-0 border-t border-sidebar-border",
          collapsed
            ? "flex flex-col items-center gap-1 px-1.5 py-2"
            : "flex flex-col gap-0.5 p-2",
        )}
      >
        <Link
          href={NAV_SETTINGS.href}
          onClick={onNavigate}
          prefetch
          aria-current={
            isActivePath(pathname, NAV_SETTINGS.href) ? "page" : undefined
          }
          aria-label={collapsed ? NAV_SETTINGS.title : undefined}
          title={collapsed ? NAV_SETTINGS.title : undefined}
          className={cn(
            "flex items-center outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed
              ? "size-8 justify-center rounded-md"
              : "h-8 gap-2 rounded-md px-2 text-[13px]",
            isActivePath(pathname, NAV_SETTINGS.href)
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
          )}
        >
          <Settings
            aria-hidden
            className="size-4 shrink-0 opacity-70"
            strokeWidth={
              isActivePath(pathname, NAV_SETTINGS.href) ? 2.1 : 1.85
            }
          />
          {!collapsed ? <span>{NAV_SETTINGS.title}</span> : null}
        </Link>

        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "px-1 py-1",
          )}
        >
          <AccountMenu
            align={collapsed ? "start" : "end"}
            side="top"
            className="size-8"
          />
        </div>
      </div>
    </aside>
  );
}
