"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";

import { signOut } from "@/actions/auth";
import { updateUserSettings } from "@/actions/settings";
import { UserAvatar } from "@/components/layout/user-avatar";
import { useUser } from "@/components/providers/user-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_SETTINGS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AppThemePref } from "@/types/settings";

type AccountMenuProps = {
  className?: string;
  /** Header: compact circle. Sidebar: avatar + name row. */
  variant?: "header" | "sidebar";
  align?: "start" | "end" | "center";
  side?: "top" | "right" | "bottom" | "left";
};

export function AccountMenu({
  className,
  variant = "header",
  align = "end",
  side = "bottom",
}: AccountMenuProps) {
  const { name, email } = useUser();
  const { theme, setTheme } = useTheme();

  function applyTheme(next: AppThemePref) {
    setTheme(next);
    void updateUserSettings({ theme: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground",
              className,
            )}
            aria-label={`Account · ${name}`}
          >
            <UserAvatar size={32} className="border-sidebar-border" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              {email ? (
                <span className="block truncate text-[11px] text-sidebar-foreground/45">
                  {email}
                </span>
              ) : null}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/60",
              className,
            )}
            aria-label={`Account · ${name}`}
            title={name}
          >
            <UserAvatar size={32} />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        collisionPadding={12}
        className="min-w-52"
      >
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {email ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {email}
            </p>
          ) : null}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={NAV_SETTINGS.href} prefetch>
            <Settings className="size-4 opacity-70" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={(value) => applyTheme(value as AppThemePref)}
        >
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
