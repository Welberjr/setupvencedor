type CatalogTitle = { title: string }

function normalizedTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function titleQuality(title: string): number {
  const isSlugStyle = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(title)
  const hasCapital = /[A-ZÀ-Ý]/.test(title)
  return (hasCapital ? 2 : 0) + (isSlugStyle ? 0 : 1)
}

export function dedupeCatalogItems<T extends CatalogTitle>(items: T[]): T[] {
  const unique = new Map<string, T>()

  for (const item of items) {
    const key = normalizedTitle(item.title)
    const existing = unique.get(key)
    if (!existing || titleQuality(item.title) > titleQuality(existing.title)) unique.set(key, item)
  }

  return [...unique.values()]
}
