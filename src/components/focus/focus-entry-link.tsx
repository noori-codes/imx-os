"use client";

import Link from "next/link";

import { playDefaultFocusSound } from "@/stores/focus-sound";

export function FocusEntryLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/focus"
      className={className}
      onClick={() => playDefaultFocusSound()}
    >
      {children}
    </Link>
  );
}
