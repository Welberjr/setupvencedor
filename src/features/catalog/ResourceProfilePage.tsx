import { useEffect, useState } from 'react'
import { CommandIcon } from '../brand/CommandIcon'
import { FavoriteButton } from './FavoriteButton'
import type { CatalogGuide } from './catalog-guide'
import { createResourceEditorial } from './resource-editorial'
import type { CatalogItem } from './types'
import { trackActivity } from '../../lib/activity'

type ResourceProfilePageProps = {
  item: CatalogItem
  guide: CatalogGuide
  isFavorite: boolean
  onBack: () => void
  onToggleFavorite: () => Promise<void> | void
}

function sourceDateLabel(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
}

export function ResourceProfilePage({ item, guide, isFavorite, onBack, onToggleFavorite }: ResourceProfilePageProps) {
  const [hasCopiedSource, setHasCopiedSource] = useState(false)
  const [copiedAgent, setCopiedAgent] = useState<string | null>(null)
  const [selectedStep, setSelectedStep] = useState(0)
  const editorial = createResourceEditorial(item, guide)
  const activeStep = editorial.steps[selectedStep] ?? editorial.steps[0]
  const sources = [...new Set([item.officialUrl, ...item.sourceUrls])]
  const sourceLabel = guide.sourceCheckedAt
    ? `FONTES VERIFICADAS · FONTE VERIFICADA EM ${sourceDateLabel(guide.sourceCheckedAt)}`
    : 'FONTES PÚBLICAS CADASTRADAS · CONFIRA ANTES DE USAR'

  useEffect(() => { void trackActivity('resource_opened', { catalogItemId: item.id }) }, [item.id])

  async function copyOfficialSource() {
    await navigator.clipboard?.writeText(item.officialUrl)
    setHasCopiedSource(true)
  }

  async function copyAgentText(key: string, text: string) {
    await navigator.clipboard?.writeText(text)
    setCopiedAgent(key)
  }

  return <section className="resource-profile page-shell resource-profile-pilot resource-profile-pilot-editorial">
    <button className="resource-back" onClick={onBack} type="button"><CommandIcon name="arrow" size={20} /> Voltar ao acervo</button>
    <section className="resource-primary-actions" aria-label="Ações principais do recurso">
      <a className="resource-source-action" href={item.officialUrl} onClick={() => void trackActivity('resource_source_opened', { catalogItemId: item.id })} rel="noreferrer" target="_blank">Abrir fonte oficial <span aria-hidden="true">↗</span></a>
      <button className="source-copy-button" onClick={() => void copyOfficialSource()} type="button">{hasCopiedSource ? 'Link copiado' : 'Copiar link da fonte oficial'}</button>
      <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} title={item.title} />
    </section>
    <section className="handdrawn-guide" aria-labelledby="editorial-playbook-title">
      <header className="handdrawn-guide-heading">
        <img alt="Marca Setup Vencedor" src="/brand/setup-vencedor-sv-approved.png" />
        <div><p>{item.type} · {item.category}</p><h2 id="editorial-playbook-title">{item.title}</h2><span>{guide.plainLanguage}</span></div>
      </header>
      <div className="handdrawn-guide-route"><p>{editorial.eyebrow}</p><h3>{editorial.heading}</h3><span>{editorial.introduction}</span></div>
      <div className="handdrawn-guide-map">
        <ol className="handdrawn-guide-steps">{editorial.steps.map((step, index) => <li className={`handdrawn-step handdrawn-step-${index + 1}`} key={step.title}><button aria-label={step.title} aria-pressed={selectedStep === index} onClick={() => setSelectedStep(index)} type="button"><span aria-hidden="true">{index + 1}</span><strong>{step.title}</strong><small>{step.detail}</small></button></li>)}</ol>
        <figure className="handdrawn-guide-art"><img alt={editorial.illustration.alt} decoding="async" height="800" loading="lazy" src={editorial.illustration.src} width="1200" /><figcaption>Toque em uma caixa para escolher a próxima ação.</figcaption></figure>
      </div>
      <section className="handdrawn-guide-detail" aria-live="polite">
        <div><p>AGORA, FAÇA ISTO</p><h3>{activeStep.title}</h3><span>{activeStep.detail}</span></div>
        <div className="handdrawn-guide-copy-actions">
          <button aria-label={`Copiar etapa ${activeStep.title} para Claude Code`} onClick={() => void copyAgentText(`step-${selectedStep}-claude`, activeStep.claudePrompt)} type="button">{copiedAgent === `step-${selectedStep}-claude` ? 'Prompt copiado' : 'Copiar para Claude Code'}</button>
          <button aria-label={`Copiar etapa ${activeStep.title} para Codex`} onClick={() => void copyAgentText(`step-${selectedStep}-codex`, activeStep.codexPrompt)} type="button">{copiedAgent === `step-${selectedStep}-codex` ? 'Prompt copiado' : 'Copiar para Codex'}</button>
        </div>
      </section>
      <section className="handdrawn-guide-notes" aria-label={`Anotações práticas de ${item.title}`}>
        <article className="handdrawn-note handdrawn-note-blue"><p>AJUDA A</p><span>{guide.solves}</span></article>
        <article className="handdrawn-note handdrawn-note-coral"><p>BRILHA QUANDO</p><span>{guide.whenToUse}</span></article>
        <article className="handdrawn-note handdrawn-note-lilac"><p>DEIXE PARA OUTRA HORA</p><span>{guide.whenNotToUse}</span></article>
        <article className="handdrawn-note handdrawn-note-green"><p>LEMBRETES PARA A PRIMEIRA VOLTA</p><ol>{guide.firstSteps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol></article>
      </section>
      <section className="handdrawn-guide-sources" aria-label={`Fontes de ${item.title}`}>
        <div><p>{sourceLabel}</p><span>{guide.sourceNote}</span></div>
        <ul>{sources.map((source, index) => <li key={source}><a href={source} onClick={() => void trackActivity('resource_source_opened', { catalogItemId: item.id })} rel="noreferrer" target="_blank">{index === 0 ? 'Fonte oficial principal' : `Fonte complementar ${index}`} <span aria-hidden="true">↗</span></a></li>)}</ul>
      </section>
    </section>
  </section>
}
