"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Button } from "@/components/ui/button";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("[imx] route error", error);
  }, [error]);

  return (
    <>
      <Header chrome title="Something went wrong" />
      <AppPageFrame className="max-w-lg gap-8 md:py-12">
        <EmptyState
          icon={AlertTriangle}
          title="This page hit a snag"
          description="Try again. If it keeps happening, jump back to the dashboard and continue from there."
          className="py-16"
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </EmptyState>
      </AppPageFrame>
    </>
  );
}
