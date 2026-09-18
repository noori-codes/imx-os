import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { searchAll } from "@/actions/search";
import { Header } from "@/components/layout/header";
import { SearchForm } from "@/components/search/search-form";
import { SearchHero } from "@/components/search/search-hero";
import { SearchJumpNav } from "@/components/search/search-jump-nav";
import { SearchQuickCreate } from "@/components/search/search-quick-create";
import { SearchResults } from "@/components/search/search-results";
import { SearchStage } from "@/components/search/search-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { resolveSearchJump } from "@/lib/search-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search",
  description: "Find anything across IMX OS",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function SearchResultsFallback({ query }: { query: string }) {
  if (query.length < 2) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-[1.5rem] imx-surface p-5 sm:p-6">
        <Bone className="h-2.5 w-24" />
        <Bone className="mt-3 h-3.5 w-48 max-w-full opacity-55" />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="imx-skeleton space-y-3"
      role="status"
      aria-live="polite"
      aria-label="Loading search results"
    >
      <Bone className="h-3 w-28" />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl imx-surface p-4"
          >
            <Bone className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3.5 w-[70%]" />
              <Bone className="h-2.5 w-full opacity-55" />
              <Bone className="h-2.5 w-16 opacity-55" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function SearchResultsSection({
  query,
  type,
}: {
  query: string;
  type?: string;
}) {
  const { results } = await searchAll(query);
  return (
    <SearchResults query={query} results={results} initialType={type} />
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const jump = resolveSearchJump(query);
  if (jump) redirect(jump.href);

  return (
    <>
      <Header chrome title="Search" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <SearchStage>
          <div className="search-reveal">
            <SearchHero>
              <header className="text-center sm:text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Command index
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Find anything
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
                  Jump to a space by name, or search across tasks, notes, goals,
                  habits, and more.
                </p>
              </header>

              <div className="search-composer rounded-2xl imx-surface imx-surface-rim p-2 sm:p-2.5">
                <SearchForm initialQuery={query} autoFocus hero />
              </div>
            </SearchHero>
          </div>

          <div className="search-reveal search-reveal-delay-1">
            <SearchJumpNav query={query} variant="page" />
          </div>

          {query.length < 2 ? (
            <div className="search-reveal search-reveal-delay-2">
              <SearchQuickCreate />
            </div>
          ) : null}

          <div className="search-reveal search-reveal-delay-2">
            <Suspense fallback={<SearchResultsFallback query={query} />}>
              <SearchResultsSection query={query} type={params.type} />
            </Suspense>
          </div>
        </SearchStage>
      </AppPageFrame>
    </>
  );
}
