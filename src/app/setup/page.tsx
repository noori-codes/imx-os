import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Setup",
  description: "Configure Supabase for IMX OS",
  robots: { index: false, follow: false },
};

export default function SetupPage() {
  return (
    <div className="auth-stage relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="auth-stage-wash" aria-hidden="true" />
      <div className="auth-stage-glow" aria-hidden="true" />
      <div className="relative z-1 flex w-full max-w-lg flex-col items-center">
        <Link
          href="/"
          className="auth-brand mb-8 flex flex-col items-center gap-3 text-center"
        >
          <span className="relative size-14 overflow-hidden rounded-2xl border border-border/60 bg-black shadow-sm sm:size-16">
            <Image
              src="/imx-logo-64.png"
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </span>
          <span className="space-y-1">
            <span className="block text-2xl font-semibold tracking-tight sm:text-3xl">
              IMX OS
            </span>
            <span className="block text-sm text-muted-foreground">
              Setup required
            </span>
          </span>
        </Link>

        <div className="auth-card w-full overflow-hidden rounded-[1.35rem] border border-border/55 bg-card/90 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)] backdrop-blur-sm">
          <div className="auth-card-glow" aria-hidden />
          <div className="relative z-1 space-y-5 p-6 sm:p-7">
            <header className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Configuration
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Supabase not configured
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Add your project credentials to unlock the app.
              </p>
            </header>

            <ol className="list-decimal space-y-2.5 pl-5 text-sm text-foreground/90">
              <li>
                Create a free project at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  supabase.com/dashboard
                </a>
              </li>
              <li>
                Open <strong>Project Settings → API</strong> and copy the{" "}
                <strong>Project URL</strong> (not the REST URL — no{" "}
                <code className="rounded-md bg-muted px-1 py-0.5 text-xs">
                  /rest/v1
                </code>
                ) and the anon public key
              </li>
              <li>
                Create{" "}
                <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                  .env.local
                </code>{" "}
                in the project root:
              </li>
            </ol>

            <pre className="overflow-x-auto rounded-xl border border-border/50 bg-muted/60 p-4 text-xs leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000`}
            </pre>

            <p className="text-sm text-muted-foreground">
              Then restart the dev server:{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                npm run dev
              </code>
            </p>

            <Button asChild className="h-11 w-full rounded-xl">
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Supabase API settings
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
