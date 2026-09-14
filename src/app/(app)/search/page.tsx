import { searchAll } from "@/actions/search";
import { Header } from "@/components/layout/header";
import { SearchForm } from "@/components/search/search-form";
import { SearchResults } from "@/components/search/search-results";
import { SearchStage } from "@/components/search/search-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
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
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-xs text-muted-foreground">Find anything</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Search
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                One place for tasks, notes, goals, projects, habits, events, and
                books — or press ⌘K anywhere.
              </p>
            </header>
          </div>

          <div className="search-reveal search-reveal-delay-1 mx-auto w-full max-w-2xl">
            <SearchForm initialQuery={query} autoFocus hero />
          </div>

          <div className="search-reveal search-reveal-delay-2">
            <SearchResults
              query={query}
              results={results}
              initialType={params.type}
            />
          </div>
        </SearchStage>
      </AppPageFrame>
    </>
  );
}
