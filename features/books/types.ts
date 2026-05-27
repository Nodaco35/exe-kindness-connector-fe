export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
}

export interface BookResponse {
  data: Book[];
  total: number;
}
