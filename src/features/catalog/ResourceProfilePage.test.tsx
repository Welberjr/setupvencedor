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
  expect(screen.getByRole('img', { name: 'Ilustração desenhada à mão sobre Frontend Design' })).toHaveAttribute('src', '/illustrations/frontend-design-handdrawn-guide.png')
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

it('lets a teammate select and copy a Web Design Premium step', async () => {
  const user = userEvent.setup()
  const webDesignItem = { ...frontendDesignItem, slug: 'skills-web-design-premium', title: 'As skills de web design que fazem o Claude parar de criar site genérico' }

  render(<ResourceProfilePage item={webDesignItem} guide={{ ...guide, estimatedMinutes: 25 }} isFavorite={false} onBack={() => {}} onToggleFavorite={() => {}} />)

  expect(screen.getByRole('heading', { name: 'Construa com intenção' })).toBeInTheDocument()
  expect(screen.getByText('Liste a ação principal e o que a pessoa precisa entender em poucos segundos.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Direção visual' }))

  expect(screen.getByText('Traga uma referência de clima sem copiar marcas, páginas ou layouts de terceiros.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copiar passo Direção visual para Claude Code' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copiar passo Direção visual para Codex' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Antes de começar' })).not.toBeInTheDocument()
})
