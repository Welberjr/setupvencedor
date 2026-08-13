function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function isRedundantCategoryLabel(type: string, category: string) {
  const normalizedType = normalizeLabel(type)
  const normalizedCategory = normalizeLabel(category)

  return normalizedCategory === normalizedType
    || normalizedCategory === `${normalizedType}s`
    || normalizedCategory === `${normalizedType}es`
}
