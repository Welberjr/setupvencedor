const aliases: Record<string, string[]> = {
  ui: ['frontend', 'layout'],
  layout: ['frontend', 'ui'],
}

export function buildSearchTerms(query: string): string[] {
  return [
    ...new Set(
      query
        .toLocaleLowerCase('pt-BR')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((term) => [term, ...(aliases[term] ?? [])]),
    ),
  ]
}

export function explainMatch(queryTerms: string[], matchedTerms: string[]): string {
  const matchingTerms = matchedTerms.filter((term) => queryTerms.includes(term))
  return `Encontrado por: ${matchingTerms.join(', ')}`
}
