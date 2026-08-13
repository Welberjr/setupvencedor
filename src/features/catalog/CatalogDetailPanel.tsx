import { CommandIcon } from '../brand/CommandIcon'
import { FavoriteButton } from './FavoriteButton'
import { PublicSources } from './PublicSources'
import { createCatalogNarrative } from './catalog-narrative'
import { FirstSteps } from './FirstSteps'
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
        <button aria-label="Fechar detalhes" className="icon-button" onClick={onClose} type="button"><CommandIcon name="close" /></button>
      </header>
      <p className="detail-lead">{narrative.impact}</p>
      <div className="detail-grid">
        <article><p className="detail-kicker">O que é</p><p>{narrative.whatItIs}</p></article>
        <article><p className="detail-kicker">Quando faz sentido</p><p>{narrative.whenToUse}</p></article>
        <article className="detail-block-steps"><p className="detail-kicker">Primeiro passo</p><FirstSteps steps={narrative.firstSteps} /></article>
        <article><p className="detail-kicker">Como a equipe pode usar</p><p>{narrative.teamUse}</p></article>
      </div>
      <div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      <div className="detail-actions"><PublicSources officialUrl={item.officialUrl} sourceUrls={item.sourceUrls} /><FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} title={item.title} /></div>
    </section>
  </div>
}
