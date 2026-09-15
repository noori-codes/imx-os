"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Last-resort boundary when the root layout itself fails. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[imx] global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            IMX OS
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Something broke
          </h1>
          <p className="text-sm text-muted-foreground">
            Reload the app. If it keeps happening, sign in again from the
            dashboard link below.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Button type="button" className="h-11 rounded-xl" onClick={reset}>
              Try again
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
