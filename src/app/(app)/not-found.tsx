import Link from "next/link";
import { Search, Target } from "lucide-react";

import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <>
      <Header chrome title="Not found" />
      <AppPageFrame className="max-w-lg gap-8 md:py-12">
        <EmptyState
          icon={Target}
          title="Page not found"
          description="That route doesn’t exist in IMX OS — or you don’t have access."
          className="py-16"
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/search">
                <Search className="size-3.5" />
                Search
              </Link>
            </Button>
          </div>
        </EmptyState>
      </AppPageFrame>
    </>
  );
}
