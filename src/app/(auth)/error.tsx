"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type AuthErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    console.error("[imx] auth error", error);
  }, [error]);

  return (
    <div className="auth-card w-full max-w-sm space-y-4 rounded-[1.35rem] border border-border/55 bg-card/90 p-6 text-center shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)] backdrop-blur-sm sm:p-7">
      <AlertTriangle className="mx-auto size-8 text-muted-foreground" />
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Sign-in hit a snag</h1>
        <p className="text-sm text-muted-foreground">
          Try again, or head back to the landing page.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" className="h-11 rounded-xl" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
