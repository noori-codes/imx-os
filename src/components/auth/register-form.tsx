"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { signup, type AuthState } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RegisterFormProps = {
  callbackError?: string | null;
};

export function RegisterForm({ callbackError = null }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState<AuthState | null, FormData>(
    signup,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);

  const busy = pending || oauthPending;
  const done = Boolean(state?.success);
  const formError = state?.error ?? null;

  return (
    <div className="auth-card w-full max-w-[24rem] overflow-hidden rounded-[1.5rem] imx-surface imx-surface-rim">
      <div className="auth-card-glow" aria-hidden />
      <div className="relative z-1 space-y-6 p-6 sm:p-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Get started
          </p>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-3xl">
            Create account
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your private OS for focus, goals, and daily rhythm.
          </p>
        </header>

        {done && state?.success ? (
          <AuthFeedback tone="success" message={state.success} />
        ) : null}

        {!done ? (
          <OAuthButtons
            initialError={callbackError}
            disabled={pending}
            onPendingChange={setOauthPending}
            hideInlineError={Boolean(formError)}
          />
        ) : null}

        <form action={formAction} className="space-y-4">
          {formError ? <AuthFeedback tone="error" message={formError} /> : null}

          {!done ? (
            <>
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
                  disabled={busy}
                  aria-invalid={Boolean(formError)}
                  className="h-11 rounded-xl border-surface-border bg-surface transition-[border-color,box-shadow] focus-visible:border-foreground/25"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    disabled={busy}
                    aria-invalid={Boolean(formError)}
                    className="h-11 rounded-xl border-surface-border bg-surface pr-11 transition-[border-color,box-shadow] focus-visible:border-foreground/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={busy}
                    className="absolute top-1/2 right-2.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  At least 8 characters
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    disabled={busy}
                    aria-invalid={Boolean(formError)}
                    className="h-11 rounded-xl border-surface-border bg-surface pr-11 transition-[border-color,box-shadow] focus-visible:border-foreground/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    disabled={busy}
                    className="absolute top-1/2 right-2.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:opacity-50"
                    aria-label={
                      showConfirm
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={busy}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </>
          ) : null}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className={cn(
              "font-medium text-foreground underline-offset-4 hover:underline",
            )}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
