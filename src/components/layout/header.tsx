"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type HeaderProps = {
  title: string;
  description?: string;
};

export function Header({ title, description }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="hidden text-sm text-muted-foreground sm:block">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" className="sm:hidden">
          <Link href="/search" aria-label="Search">
            <Search className="size-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="hidden h-9 w-52 justify-start gap-2 text-muted-foreground sm:inline-flex"
        >
          <Link href="/search">
            <Search className="size-4" />
            <span className="truncate">Search…</span>
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
