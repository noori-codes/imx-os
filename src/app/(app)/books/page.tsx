import { getBooks } from "@/actions/books";
import { BooksShelf } from "@/components/books/books-shelf";
import { BooksStage } from "@/components/books/books-stage";
import { BooksStats } from "@/components/books/books-stats";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

export default async function BooksPage() {
  const books = await getBooks();
  const year = new Date().getFullYear();

  const reading = books.filter((book) => book.status === "reading").length;
  const wantToRead = books.filter(
    (book) => book.status === "want_to_read",
  ).length;
  const finishedYear = books.filter((book) => {
    if (book.status !== "finished") return false;
    const stamp = book.finished_at ?? book.updated_at;
    return new Date(stamp).getFullYear() === year;
  }).length;

  const rated = books.filter((book) => book.rating != null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, book) => sum + (book.rating ?? 0), 0) / rated.length
      : null;

  return (
    <>
      <Header title="Books" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <BooksStage>
          <div className="books-reveal">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reading shelf</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Books
                </h2>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Track what you&apos;re reading, finished, and want next.
                </p>
              </div>
            </header>
          </div>

          <div className="books-reveal books-reveal-delay-1">
            <BooksStats
              reading={reading}
              finishedYear={finishedYear}
              wantToRead={wantToRead}
              avgRating={avgRating}
            />
          </div>

          <div className="books-reveal books-reveal-delay-2">
            <BooksShelf books={books} />
          </div>
        </BooksStage>
      </AppPageFrame>
    </>
  );
}
