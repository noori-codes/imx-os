import { Suspense } from "react";
import type { Metadata } from "next";

import { getBooks } from "@/actions/books";
import { BooksPulse } from "@/components/books/books-pulse";
import { BooksShelf } from "@/components/books/books-shelf";
import { BooksSkeleton } from "@/components/books/books-skeleton";
import { BooksStage } from "@/components/books/books-stage";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { bookProgressPercent } from "@/types/book";

export const metadata: Metadata = {
  title: "Books",
  description: "Reading shelf and finished books",
};

async function BooksBody({ compose }: { compose: boolean }) {
  const books = await getBooks();
  const year = new Date().getFullYear();

  const readingBooks = books.filter((book) => book.status === "reading");
  const reading = readingBooks.length;
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

  const progressValues = readingBooks
    .map((book) => bookProgressPercent(book))
    .filter((value): value is number => value != null);
  const readingProgress =
    progressValues.length > 0
      ? Math.round(
          progressValues.reduce((sum, value) => sum + value, 0) /
            progressValues.length,
        )
      : null;

  const lead =
    readingBooks.find((book) => bookProgressPercent(book) != null) ??
    readingBooks[0] ??
    null;

  return (
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <BooksStage>
        <div className="books-reveal">
          <BooksPulse
            stats={{
              reading,
              finishedYear,
              wantToRead,
              avgRating,
              year,
              readingProgress,
              currentTitle: lead?.title ?? null,
            }}
          />
        </div>

        <div className="books-reveal books-reveal-delay-1">
          <BooksShelf books={books} compose={compose} />
        </div>
      </BooksStage>
    </AppPageFrame>
  );
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string }>;
}) {
  const params = await searchParams;
  const compose = params.compose === "1";

  return (
    <>
      <Header chrome title="Books" />
      <Suspense fallback={<BooksSkeleton />}>
        <BooksBody compose={compose} />
      </Suspense>
    </>
  );
}
