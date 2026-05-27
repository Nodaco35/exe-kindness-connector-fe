export const BOOK_ENDPOINTS = {
  GET_ALL: "/books",
  GET_DETAIL: (id: string) => `/books/${id}`,
} as const;
