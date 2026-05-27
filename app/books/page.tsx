import type { Metadata } from "next";
import { BookList, bookService } from "@/features/books";
import type { BookResponse } from "@/features/books";

const emptyBookResponse: BookResponse = {
  data: [],
  total: 0,
};

async function getBooksSafely(): Promise<BookResponse> {
  try {
    return await bookService.getBooks();
  } catch {
    return emptyBookResponse;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const res = await getBooksSafely();

  return {
    title: `Books (${res.total})`,
    description: "Browse the latest books in the collection.",
  };
}

export default async function BooksPage() {
  const res = await getBooksSafely();

  return <BookList initialBooks={res.data} />;
}
