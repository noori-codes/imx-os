import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="auth-stage relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="auth-stage-wash" aria-hidden="true" />
      <div className="auth-stage-glow" aria-hidden="true" />
      <div className="relative z-1 flex w-full max-w-sm flex-col items-center text-center">
        <Link
          href="/"
          className="auth-brand mb-8 flex flex-col items-center gap-3"
        >
          <span className="relative size-14 overflow-hidden rounded-2xl border border-border/60 bg-black shadow-sm">
            <Image
              src="/imx-logo-64.png"
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              priority
            />
          </span>
          <span className="text-2xl font-semibold tracking-tight">IMX OS</span>
        </Link>

        <div className="auth-card w-full space-y-4 rounded-[1.35rem] border border-border/55 bg-card/90 p-6 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)] backdrop-blur-sm sm:p-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            That route doesn’t exist — or you don’t have access.
          </p>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
            <Button asChild className="h-11 rounded-xl">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/search">Search</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
