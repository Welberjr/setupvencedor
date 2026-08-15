import { useState } from 'react'
import { CommandIcon } from '../brand/CommandIcon'
import { FavoriteButton } from './FavoriteButton'
import type { CatalogGuide } from './catalog-guide'
import { getResourceProfilePilot } from './resource-profile-pilots'
import type { CatalogItem } from './types'

type ResourceProfilePageProps = {
  item: CatalogItem
  guide: CatalogGuide
  isFavorite: boolean
  onBack: () => void
  onToggleFavorite: () => Promise<void> | void
}

const levelLabel = { iniciante: 'Para começar', intermediario: 'Para quem já pratica', avancado: 'Para aprofundar' }

function sourceDateLabel(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
}

export function ResourceProfilePage({ item, guide, isFavorite, onBack, onToggleFavorite }: ResourceProfilePageProps) {
  const [hasCopiedSource, setHasCopiedSource] = useState(false)
  const [copiedAgent, setCopiedAgent] = useState<string | null>(null)
  const [selectedPilotStep, setSelectedPilotStep] = useState(0)
  const pilot = getResourceProfilePilot(item.slug)
  const claudeCommand = item.instructions.trim().startsWith('/') ? item.instructions.trim() : null
  const claudePrompt = claudeCommand ?? `Leia a fonte oficial de ${item.title} em ${item.officialUrl}. Explique como instalar ou usar este recurso neste projeto e indique o primeiro passo sem alterar nada ainda.`
  const codexPrompt = `Leia a fonte oficial de ${item.title} em ${item.officialUrl}. Explique como isso se aplica a este projeto e proponha o primeiro passo sem alterar nada ainda.`
  const sources = [...new Set([item.officialUrl, ...item.sourceUrls])]
  const activeEditorialStep = pilot?.kind === 'editorial' ? pilot.steps[selectedPilotStep] ?? pilot.steps[0] : null
  const activePilotStep = pilot?.steps[selectedPilotStep] ?? pilot?.steps[0]

  async function copyOfficialSource() {
    await navigator.clipboard?.writeText(item.officialUrl)
    setHasCopiedSource(true)
  }

  async function copyAgentText(key: string, text: string) {
    await navigator.clipboard?.writeText(text)
    setCopiedAgent(key)
  }

  return <section className={`resource-profile page-shell${pilot ? ` resource-profile-pilot resource-profile-pilot-${pilot.kind}` : ''}`}>
    <button className="resource-back" onClick={onBack} type="button"><CommandIcon name="arrow" size={20} /> Voltar ao acervo</button>
    {pilot?.kind !== 'editorial' ? <header className="resource-profile-heading">
      <p className="eyebrow">{item.type} · {item.category}</p>
      <h1>{item.title}</h1>
      <p>{guide.plainLanguage}</p>
    </header> : null}
    {pilot?.kind !== 'editorial' ? <section className="resource-profile-facts" aria-label="Informações verificadas do recurso"><span>{levelLabel[guide.level]}</span><span>{guide.estimatedMinutes} min para testar</span><span>Fonte verificada em {sourceDateLabel(guide.sourceCheckedAt)}</span></section> : null}
    <section className="resource-primary-actions" aria-label="Ações principais do recurso">
      <a className="resource-source-action" href={item.officialUrl} rel="noreferrer" target="_blank">Abrir fonte oficial <span aria-hidden="true">↗</span></a>
      <button className="source-copy-button" onClick={() => void copyOfficialSource()} type="button">{hasCopiedSource ? 'Link copiado' : 'Copiar link da fonte oficial'}</button>
      <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} title={item.title} />
    </section>
    {pilot?.kind === 'editorial' && activeEditorialStep ? <section className="handdrawn-guide" aria-labelledby="editorial-playbook-title">
      <header className="handdrawn-guide-heading"><img alt="Marca Setup Vencedor" src="/brand/setup-vencedor-sv-approved.png" /><div><p>{item.type} · {item.category}</p><h2 id="editorial-playbook-title">{item.title}</h2><span>{guide.plainLanguage}</span></div></header>
      <div className="handdrawn-guide-route"><p>{pilot.eyebrow}</p><h3>{pilot.heading}</h3><span>Um mapa prático para sair do briefing e chegar a uma primeira tela com intenção.</span></div>
      <div className="handdrawn-guide-map">
        <ol className="handdrawn-guide-steps">{pilot.steps.map((step, index) => <li className={`handdrawn-step handdrawn-step-${index + 1}`} key={step.title}><button aria-label={step.title} aria-pressed={selectedPilotStep === index} onClick={() => setSelectedPilotStep(index)} type="button"><span aria-hidden="true">{index + 1}</span><strong>{step.title}</strong><small>{step.detail}</small></button></li>)}</ol>
        <figure className="handdrawn-guide-art"><img alt="Ilustração desenhada à mão sobre Frontend Design" src="/illustrations/frontend-design-handdrawn-guide.png" /><figcaption>Toque em uma caixa para escolher a próxima ação.</figcaption></figure>
      </div>
      <section className="handdrawn-guide-detail" aria-live="polite"><div><p>AGORA, FAÇA ISTO</p><h3>{activeEditorialStep.title}</h3><span>{activeEditorialStep.detail}</span></div><div className="handdrawn-guide-copy-actions"><button aria-label={`Copiar etapa ${activeEditorialStep.title} para Claude Code`} onClick={() => void copyAgentText(`editorial-${selectedPilotStep}-claude`, activeEditorialStep.claudePrompt)} type="button">{copiedAgent === `editorial-${selectedPilotStep}-claude` ? 'Prompt copiado' : 'Copiar para Claude Code'}</button><button aria-label={`Copiar etapa ${activeEditorialStep.title} para Codex`} onClick={() => void copyAgentText(`editorial-${selectedPilotStep}-codex`, activeEditorialStep.codexPrompt)} type="button">{copiedAgent === `editorial-${selectedPilotStep}-codex` ? 'Prompt copiado' : 'Copiar para Codex'}</button></div></section>
      <section className="handdrawn-guide-notes" aria-label="Anotações práticas do Frontend Design">
        <article className="handdrawn-note handdrawn-note-blue"><p>AJUDA A</p><span>{guide.solves}</span></article>
        <article className="handdrawn-note handdrawn-note-coral"><p>BRILHA QUANDO</p><span>{guide.whenToUse}</span></article>
        <article className="handdrawn-note handdrawn-note-lilac"><p>DEIXE PARA OUTRA HORA</p><span>{guide.whenNotToUse}</span></article>
        <article className="handdrawn-note handdrawn-note-green"><p>LEMBRETES PARA A PRIMEIRA VOLTA</p><ol>{guide.firstSteps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol></article>
      </section>
      <section className="handdrawn-guide-sources" aria-label="Fontes verificadas do Frontend Design"><div><p>FONTES VERIFICADAS · FONTE VERIFICADA EM {sourceDateLabel(guide.sourceCheckedAt)}</p><span>{guide.sourceNote}</span></div><ul>{sources.map((source, index) => <li key={source}><a href={source} rel="noreferrer" target="_blank">{index === 0 ? 'Fonte oficial principal' : `Fonte complementar ${index}`} <span aria-hidden="true">↗</span></a></li>)}</ul></section>
    </section> : null}
    {pilot?.kind === 'visual-steps' && activePilotStep ? <section className="visual-stepper" aria-labelledby="visual-stepper-title">
      <div className="visual-stepper-intro"><p className="eyebrow">{pilot.eyebrow}</p><h2 id="visual-stepper-title">{pilot.heading}</h2><p>Escolha uma etapa, execute o menor próximo passo e só então avance.</p></div>
      <div className="visual-stepper-rail" aria-label="Etapas do roteiro">{pilot.steps.map((step, index) => <button aria-label={step.title} aria-pressed={selectedPilotStep === index} className={selectedPilotStep === index ? 'selected' : ''} key={step.title} onClick={() => setSelectedPilotStep(index)} type="button"><b aria-hidden="true">0{index + 1}</b><span>{step.title}</span></button>)}</div>
      <article className="visual-stepper-detail"><p className="eyebrow">ETAPA ATUAL</p><h3>{activePilotStep.title}</h3><p>{activePilotStep.detail}</p><div><button aria-label={`Copiar passo ${activePilotStep.title} para Claude Code`} onClick={() => void copyAgentText(`step-${selectedPilotStep}-claude`, activePilotStep.claudePrompt)} type="button">{copiedAgent === `step-${selectedPilotStep}-claude` ? 'Prompt copiado' : activePilotStep.claudeLabel}</button><button aria-label={`Copiar passo ${activePilotStep.title} para Codex`} onClick={() => void copyAgentText(`step-${selectedPilotStep}-codex`, activePilotStep.codexPrompt)} type="button">{copiedAgent === `step-${selectedPilotStep}-codex` ? 'Prompt copiado' : activePilotStep.codexLabel}</button></div></article>
    </section> : null}
    {pilot?.kind !== 'editorial' ? <><div className="resource-profile-grid">
      <article><h2>Para que serve</h2><p>{guide.solves}</p></article>
      <article><h2>Quando usar</h2><p>{guide.whenToUse}</p></article>
      <article><h2>Quando não usar</h2><p>{guide.whenNotToUse}</p></article>
      <article className="resource-steps"><h2>Comece por aqui</h2><ol>{guide.firstSteps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol></article>
    </div>
    <section className="resource-sources" aria-labelledby="resource-sources-title"><div><p className="eyebrow">FONTES E CONFIANÇA</p><h2 id="resource-sources-title">Confira antes de usar</h2><p>{guide.sourceNote}</p></div><ul>{sources.map((source, index) => <li key={source}><a href={source} rel="noreferrer" target="_blank">{index === 0 ? 'Fonte oficial principal' : `Fonte complementar ${index}`} <span aria-hidden="true">↗</span></a></li>)}</ul></section></> : null}
    {!pilot ? <section className="resource-install" aria-label="Como usar este recurso com agentes">
      <div><p className="eyebrow">Atalho de uso</p><h2>Use no Claude Code</h2><p>{claudeCommand ? 'Abra o Claude Code dentro do projeto, execute este comando uma única vez e depois descreva a tarefa que você quer realizar.' : 'Abra o Claude Code dentro do projeto, consulte a fonte oficial e peça para ele adaptar este recurso à tarefa atual.'}</p><button aria-label="Copiar texto para Claude Code" className="agent-copy-box" onClick={() => void copyAgentText('default-claude', claudePrompt)} type="button"><code>{claudePrompt}</code><small>{copiedAgent === 'default-claude' ? 'Texto copiado' : 'Clique para copiar'}</small></button></div>
      <div><p className="eyebrow">Atalho de uso</p><h2>Use no Codex</h2><p>Abra o projeto no Codex, envie este pedido e deixe o agente avaliar a fonte antes de sugerir mudanças.</p><button aria-label="Copiar texto para Codex" className="agent-copy-box" onClick={() => void copyAgentText('default-codex', codexPrompt)} type="button"><code>{codexPrompt}</code><small>{copiedAgent === 'default-codex' ? 'Texto copiado' : 'Clique para copiar'}</small></button></div>
    </section> : null}
    {!pilot && guide.prerequisites.length ? <section className="resource-prerequisites"><h2>Antes de começar</h2><ul>{guide.prerequisites.map((prerequisite) => <li key={prerequisite}>{prerequisite}</li>)}</ul></section> : null}
  </section>
}
