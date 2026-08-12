import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold tracking-tight"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
          IM
        </span>
        <span className="text-lg">IMX OS</span>
      </Link>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Supabase not configured</CardTitle>
          <CardDescription>
            Add your Supabase credentials to start the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a free project at{" "}
              <a
                href="https://supabase.com/dashboard"
                className="text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                supabase.com/dashboard
              </a>
            </li>
            <li>
              Open <strong>Project Settings → API</strong> and copy the{" "}
              <strong>Project URL</strong> (not the REST URL — no{" "}
              <code className="rounded bg-muted px-1 py-0.5">/rest/v1</code>) and
              the anon public key
            </li>
            <li>
              Create <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code>{" "}
              in the project root:
            </li>
          </ol>

          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000`}
          </pre>

          <p className="text-muted-foreground">
            Then restart the dev server:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">npm run dev</code>
          </p>

          <Button asChild className="w-full">
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Supabase API settings
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
