import { searchAll } from "@/actions/search";
import { Header } from "@/components/layout/header";
import { SearchForm } from "@/components/search/search-form";
import { SearchResults } from "@/components/search/search-results";
import { SearchStage } from "@/components/search/search-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const { results } = await searchAll(query);

  return (
    <>
      <Header title="Search" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <SearchStage>
          <div className="search-reveal">
            <header className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Find anything</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Search
              </h2>
              <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">
                Tasks, notes, goals, projects, habits, events, and books in one
                place.
              </p>
            </header>
          </div>

          <div className="search-reveal search-reveal-delay-1">
            <div className="search-composer rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Query
              </p>
              <SearchForm initialQuery={query} autoFocus />
            </div>
          </div>

          <div className="search-reveal search-reveal-delay-2">
            <SearchResults query={query} results={results} />
          </div>
        </SearchStage>
      </AppPageFrame>
    </>
  );
}
