export interface IPagination<T> {
  items: T[];
  itemsCount: number;
  skip: number;
  pagesCount: number;
  limit: number;
}
