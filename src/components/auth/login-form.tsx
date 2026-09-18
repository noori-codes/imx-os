"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { login, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState | null, FormData>(
    login,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-card w-full max-w-sm overflow-hidden rounded-[1.35rem] imx-surface imx-surface-rim">
      <div className="auth-card-glow" aria-hidden />
      <div className="relative z-1 space-y-6 p-6 sm:p-7">
        <header className="space-y-1.5 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pick up your tasks, focus, habits, and notes.
          </p>
        </header>

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
              className="h-11 rounded-xl border-surface-border bg-surface"
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
                disabled={pending}
                className="h-11 rounded-xl border-surface-border bg-surface pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={pending}
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
            disabled={pending}
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
