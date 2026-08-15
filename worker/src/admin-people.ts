export type PeoplePagination = { page: number; pageSize: 10 | 20 }

function positiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function parsePeoplePagination(params: URLSearchParams): PeoplePagination {
  const requestedPage = positiveInteger(params.get('page'))
  const requestedPageSize = positiveInteger(params.get('pageSize'))
  return {
    page: requestedPage ?? 1,
    pageSize: requestedPageSize === 20 ? 20 : 10,
  }
}
