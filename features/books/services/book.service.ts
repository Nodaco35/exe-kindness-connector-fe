import { api } from "@/lib/api-client";
import { BOOK_ENDPOINTS } from "./endpoints";
import type { Book, BookResponse } from "../types";

export async function getBooks(): Promise<BookResponse> {
  const response = await api.get<BookResponse>(BOOK_ENDPOINTS.GET_ALL);

  return response.data;
}

// getBookById
export async function getBookById(id: string): Promise<Book> {
  const response = await api.get<Book>(BOOK_ENDPOINTS.GET_DETAIL(id));

  return response.data;
}
