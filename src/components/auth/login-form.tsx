"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { login, type AuthState } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  callbackError?: string | null;
};

export function LoginForm({ callbackError = null }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<AuthState | null, FormData>(
    login,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);

  const busy = pending || oauthPending;
  const formError = state?.error ?? null;

  return (
    <div className="auth-card w-full max-w-[24rem] overflow-hidden rounded-[1.5rem] imx-surface imx-surface-rim">
      <div className="auth-card-glow" aria-hidden />
      <div className="relative z-1 space-y-6 p-6 sm:p-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-3xl">
            Sign in
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pick up your tasks, focus, habits, and notes.
          </p>
        </header>

        <OAuthButtons
          initialError={callbackError}
          disabled={pending}
          onPendingChange={setOauthPending}
          hideInlineError={Boolean(formError)}
        />

        <form action={formAction} className="space-y-4">
          {formError ? <AuthFeedback tone="error" message={formError} /> : null}

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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
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
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl"
            disabled={busy}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className={cn(
              "font-medium text-foreground underline-offset-4 hover:underline",
            )}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
