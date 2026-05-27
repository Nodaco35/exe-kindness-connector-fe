export interface ApiResponse<T> {
  Status: number;
  StatusCode?: number;
  Object?: T;
  Message?: string;
  isError?: boolean;
  isOk?: boolean;
}
