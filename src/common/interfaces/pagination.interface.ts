export interface IPagination<T> {
  items: T[];
  skip: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}
