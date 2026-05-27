"use client";

import type { Book } from "../types";

interface BookListProps {
  initialBooks: Book[];
}

export function BookList({ initialBooks }: BookListProps) {
  if (initialBooks.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
        <div className="w-full rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-950">Books</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            No books are available yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Books
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Browse the latest books in the collection.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {initialBooks.map((book) => (
          <article
            key={book.id}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
          >
            <div className="aspect-[4/3] bg-zinc-100">
              {book.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="p-5">
              <h2 className="line-clamp-2 text-lg font-semibold text-zinc-950">
                {book.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-zinc-700">
                {book.author}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                {book.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
