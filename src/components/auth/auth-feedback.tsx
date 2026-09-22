"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  describeAuthError,
  describeAuthSuccess,
  type AuthFeedbackDetail,
} from "@/lib/auth-messages";
import { cn } from "@/lib/utils";

type AuthFeedbackProps = {
  tone: "error" | "success";
  message: string;
  className?: string;
  /** Override auto-mapped copy when you already have structured detail. */
  detail?: AuthFeedbackDetail;
};

export function AuthFeedback({
  tone,
  message,
  className,
  detail,
}: AuthFeedbackProps) {
  const resolved =
    detail ??
    (tone === "success"
      ? describeAuthSuccess(message)
      : describeAuthError(message));

  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "auth-feedback flex gap-3 rounded-2xl border px-3.5 py-3.5",
        tone === "error"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-foreground/15 bg-foreground/5 text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "success" ? "text-foreground/80" : "text-destructive",
        )}
        aria-hidden
      />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold tracking-tight text-current">
          {resolved.title}
        </p>
        <p
          className={cn(
            "text-sm leading-relaxed",
            tone === "error"
              ? "text-destructive/90"
              : "text-muted-foreground",
          )}
        >
          {resolved.body}
        </p>
        {resolved.href && resolved.hrefLabel ? (
          <p className="pt-1">
            <Link
              href={resolved.href}
              className={cn(
                "text-sm font-medium underline-offset-4 hover:underline",
                tone === "error" ? "text-destructive" : "text-foreground",
              )}
            >
              {resolved.hrefLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
