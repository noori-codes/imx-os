import { searchAll } from "@/actions/search";
import { Header } from "@/components/layout/header";
import { SearchForm } from "@/components/search/search-form";
import { SearchResults } from "@/components/search/search-results";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const { results } = await searchAll(query);

  return (
    <>
      <Header title="Search" description="Find anything across IMX OS" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <SearchForm initialQuery={query} autoFocus />
        <SearchResults query={query} results={results} />
      </div>
    </>
  );
}
