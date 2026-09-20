"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { updatePassword, type AuthState } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthState | null,
    FormData
  >(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="auth-card w-full max-w-[24rem] overflow-hidden rounded-[1.5rem] imx-surface imx-surface-rim">
      <div className="auth-card-glow" aria-hidden />
      <div className="relative z-1 space-y-6 p-6 sm:p-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Security
          </p>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-3xl">
            New password
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose a password with at least 8 characters.
          </p>
        </header>

        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <AuthFeedback tone="error" message={state.error} />
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                autoFocus
                disabled={pending}
                aria-invalid={Boolean(state?.error)}
                className="h-11 rounded-xl border-surface-border bg-surface pr-11 transition-[border-color,box-shadow] focus-visible:border-foreground/25"
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
                disabled={pending}
                aria-invalid={Boolean(state?.error)}
                className="h-11 rounded-xl border-surface-border bg-surface pr-11 transition-[border-color,box-shadow] focus-visible:border-foreground/25"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={pending}
                className="absolute top-1/2 right-2.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:opacity-50"
                aria-label={
                  showConfirm ? "Hide confirm password" : "Show confirm password"
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
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
