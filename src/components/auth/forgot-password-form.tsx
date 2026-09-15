"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { requestPasswordReset, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthState | null,
    FormData
  >(requestPasswordReset, null);

  return (
    <div className="auth-card w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-border/55 bg-card/90 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)] backdrop-blur-sm">
      <div className="auth-card-glow" aria-hidden />
      <div className="relative z-1 space-y-6 p-6 sm:p-7">
        <header className="space-y-1.5 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Account recovery
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reset password
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We’ll email a link to choose a new password.
          </p>
        </header>

        {state?.success ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded-xl border border-border/50 bg-foreground/5 px-3 py-2.5 text-sm text-foreground"
            >
              {state.success}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form action={formAction} className="space-y-4">
              {state?.error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  {state.error}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={pending}
                  className="h-11 rounded-xl border-border/60 bg-background/60"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
