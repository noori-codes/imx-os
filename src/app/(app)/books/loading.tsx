import { Header } from "@/components/layout/header";
import { BooksSkeleton } from "@/components/books/books-skeleton";

export default function BooksLoading() {
  return (
    <>
      <Header title="Books" />
      <BooksSkeleton />
    </>
  );
}
