import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { ResourceProfilePage } from './ResourceProfilePage'

const frontendDesignItem = {
  id: 'item-1', slug: 'skills-frontend-design', title: 'Frontend Design', type: 'Skill', summary: 'Resumo', ownContent: 'Conteúdo', officialUrl: 'https://claude.com/plugins/frontend-design', sourceUrls: [], instructions: 'Instruções', status: 'published' as const, visibility: 'team' as const, category: 'Skills', topics: [], tags: [],
}

const guide = {
  catalogItemId: 'item-1', plainLanguage: 'Explicação simples.', solves: 'Resolve um problema visual importante.', whenToUse: 'Quando a página precisa de mais personalidade.', whenNotToUse: 'Quando a tarefa não envolve interface.', firstSteps: ['Defina o público.', 'Teste uma seção.'], level: 'iniciante' as const, prerequisites: ['Ter uma ideia'], estimatedMinutes: 20, sourceCheckedAt: '2026-08-13T12:00:00.000Z', sourceNote: 'Fonte oficial verificada.',
}

it('turns Frontend Design into a hand-drawn interactive guide with clear actions', async () => {
  const user = userEvent.setup()
  render(<ResourceProfilePage item={frontendDesignItem} guide={guide} isFavorite={false} onBack={() => {}} onToggleFavorite={() => {}} />)

  expect(screen.queryByRole('heading', { name: frontendDesignItem.title, level: 1 })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: frontendDesignItem.title, level: 2 })).toBeInTheDocument()
  expect(screen.getByText(guide.plainLanguage)).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Ilustração desenhada à mão sobre Frontend Design' })).toHaveAttribute('src', '/illustrations/frontend-design-handdrawn-guide.webp')
  expect(screen.getByRole('img', { name: 'Marca Setup Vencedor' })).toHaveAttribute('src', '/brand/setup-vencedor-sv-approved.png')
  expect(screen.getByRole('heading', { name: 'Da ideia à primeira tela' })).toBeInTheDocument()
  expect(screen.getByText('GUIA VISUAL DE EXECUÇÃO')).toBeInTheDocument()
  expect(screen.queryByText('Para começar')).not.toBeInTheDocument()
  expect(screen.queryByText('20 min para testar')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Informações verificadas do recurso')).not.toBeInTheDocument()
  expect(screen.getByText(/fonte verificada em 13 de ago/i)).toBeInTheDocument()
  expect(screen.getByText(guide.solves)).toBeInTheDocument()
  expect(screen.getByText(guide.sourceNote)).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Para que serve' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Quando usar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Quando não usar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Comece por aqui' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Confira antes de usar' })).not.toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /copiar etapa .* claude code/i })).not.toHaveLength(0)
  expect(screen.getAllByRole('button', { name: /copiar etapa .* codex/i })).not.toHaveLength(0)
  expect(screen.getByRole('link', { name: /abrir fonte oficial/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /copiar link da fonte oficial/i })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Antes de começar' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /abrir fonte oficial/i })).toHaveAttribute('href', frontendDesignItem.officialUrl)

  await user.click(screen.getByRole('button', { name: 'Dê um clima à interface' }))

  expect(screen.getByRole('button', { name: 'Dê um clima à interface' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Copiar etapa Dê um clima à interface para Claude Code' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copiar etapa Dê um clima à interface para Codex' })).toBeInTheDocument()
})

it('brings Web Design Premium into the same illustrated editorial renderer', async () => {
  const user = userEvent.setup()
  const webDesignItem = { ...frontendDesignItem, slug: 'skills-web-design-premium', title: 'As skills de web design que fazem o Claude parar de criar site genérico' }

  render(<ResourceProfilePage item={webDesignItem} guide={{ ...guide, estimatedMinutes: 25 }} isFavorite={false} onBack={() => {}} onToggleFavorite={() => {}} />)

  expect(screen.getByRole('heading', { name: 'Construa com intenção' })).toBeInTheDocument()
  expect(screen.getAllByText('Liste a ação principal e o que a pessoa precisa entender em poucos segundos.')).not.toHaveLength(0)
  expect(screen.getByRole('heading', { name: webDesignItem.title, level: 2 })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Direção visual' }))

  expect(screen.getAllByText('Traga uma referência de clima sem copiar marcas, páginas ou layouts de terceiros.')).not.toHaveLength(0)
  expect(screen.getByRole('button', { name: 'Copiar etapa Direção visual para Claude Code' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copiar etapa Direção visual para Codex' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Antes de começar' })).not.toBeInTheDocument()
})

it('renders a resource without a custom pilot as a complete hand-drawn editorial page', async () => {
  const user = userEvent.setup()
  const context7Item = { ...frontendDesignItem, id: 'context7', slug: 'context7', title: 'Context7', type: 'MCP', category: 'MCPs', officialUrl: 'https://github.com/upstash/context7' }
  const fallbackGuide = { ...guide, catalogItemId: 'context7', sourceCheckedAt: null, sourceNote: 'Conteúdo editorial montado a partir da fonte pública cadastrada.' }

  render(<ResourceProfilePage item={context7Item} guide={fallbackGuide} isFavorite={false} onBack={() => {}} onToggleFavorite={() => {}} />)

  expect(screen.getByRole('heading', { name: 'Context7', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Conecte contexto ao trabalho' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Conexões desenhadas à mão/i })).toHaveAttribute('src', '/illustrations/handdrawn/categories/mcps-connections.webp')
  expect(screen.getAllByRole('button', { name: /copiar etapa .* claude code/i })).not.toHaveLength(0)
  expect(screen.getAllByRole('button', { name: /copiar etapa .* codex/i })).not.toHaveLength(0)
  expect(screen.queryByRole('heading', { name: 'Para que serve' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Antes de começar' })).not.toBeInTheDocument()
  expect(screen.getByText(/fontes públicas cadastradas/i)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Faça o primeiro teste' }))
  expect(screen.getByRole('button', { name: 'Copiar etapa Faça o primeiro teste para Codex' })).toBeInTheDocument()
})
