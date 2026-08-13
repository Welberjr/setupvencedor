import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CatalogItem } from './types'

type AssistantSearchProps = {
  query: string
  onQueryChange: (value: string) => void
  results: CatalogItem[]
  renderResults: () => ReactNode
}

const examples = ['animação', 'validar interface', 'MCP para GitHub']

export function AssistantSearch({ query, onQueryChange, results, renderResults }: AssistantSearchProps) {
  const hasSearch = query.trim().length >= 2

  return <section className="assistant-search">
    <label className="command-search assistant-search-input"><Search size={20} /><span className="sr-only">Buscar no acervo</span><input aria-label="Buscar no acervo" onChange={(event) => onQueryChange(event.target.value)} placeholder="Ex.: validar telas reais no navegador" value={query} /></label>
    {!hasSearch ? <div className="assistant-idle"><p>Digite pelo menos 2 caracteres para encontrar apenas o que importa.</p><div>{examples.map((example) => <button key={example} onClick={() => onQueryChange(example)} type="button">{example}</button>)}</div></div> : null}
    {hasSearch && results.length === 0 ? <p className="assistant-empty" role="status">Nenhum recurso corresponde à busca. Tente um tema, tecnologia ou tipo de recurso.</p> : null}
    {hasSearch && results.length > 0 ? <div className="assistant-results">{renderResults()}</div> : null}
  </section>
}
