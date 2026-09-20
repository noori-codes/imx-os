"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { requestPasswordReset, type AuthState } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthState | null,
    FormData
  >(requestPasswordReset, null);

  return (
    <div className="auth-card w-full max-w-[24rem] overflow-hidden rounded-[1.5rem] imx-surface imx-surface-rim">
      <div className="auth-card-glow" aria-hidden />
      <div className="relative z-1 space-y-6 p-6 sm:p-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Account recovery
          </p>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-3xl">
            Reset password
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We’ll email a link to choose a new password.
          </p>
        </header>

        {state?.success ? (
          <div className="space-y-4">
            <AuthFeedback tone="success" message={state.success} />
          </div>
        ) : (
          <>
            <form action={formAction} className="space-y-4">
              {state?.error ? (
                <AuthFeedback tone="error" message={state.error} />
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={pending}
                  aria-invalid={Boolean(state?.error)}
                  className="h-11 rounded-xl border-surface-border bg-surface transition-[border-color,box-shadow] focus-visible:border-foreground/25"
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
