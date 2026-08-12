import { X } from 'lucide-react'
import { FavoriteButton } from './FavoriteButton'
import { PublicSources } from './PublicSources'
import { createCatalogNarrative } from './catalog-narrative'
import type { CatalogItem } from './types'

type CatalogDetailPanelProps = {
  item: CatalogItem
  isFavorite: boolean
  onClose: () => void
  onToggleFavorite: () => Promise<void> | void
}

export function CatalogDetailPanel({ item, isFavorite, onClose, onToggleFavorite }: CatalogDetailPanelProps) {
  const narrative = createCatalogNarrative(item)
  return <div className="detail-backdrop" onMouseDown={onClose}>
    <section aria-label="Detalhes do recurso" aria-modal="true" className="detail-panel" onMouseDown={(event) => event.stopPropagation()} role="dialog">
      <header className="detail-header">
        <div><p className="eyebrow">{item.type} // {item.category}</p><h2>{item.title}</h2></div>
        <button aria-label="Fechar detalhes" className="icon-button" onClick={onClose} type="button"><X size={18} /></button>
      </header>
      <p className="detail-lead">{item.summary}</p>
      <div className="detail-grid">
        <article><p className="eyebrow">O QUE E</p><p>{narrative.whatItIs}</p></article>
        <article><p className="eyebrow">QUANDO FAZ SENTIDO</p><p>{narrative.whenToUse}</p></article>
        <article><p className="eyebrow">PRIMEIRO PASSO</p><p>{narrative.firstStep}</p></article>
        <article><p className="eyebrow">COMO A EQUIPE PODE USAR</p><p>{item.instructions}</p></article>
      </div>
      <div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      <div className="detail-actions"><PublicSources officialUrl={item.officialUrl} sourceUrls={item.sourceUrls} /><FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} title={item.title} /></div>
    </section>
  </div>
}
