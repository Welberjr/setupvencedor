export type PageWindow<T> = {
  items: T[]
  currentPage: number
  totalPages: number
}

export const ASSISTANT_RESULTS_PAGE_SIZE = 10

export function getPageWindow<T>(items: T[], requestedPage: number, pageSize: number): PageWindow<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)
  const start = (currentPage - 1) * pageSize
  return { items: items.slice(start, start + pageSize), currentPage, totalPages }
}
