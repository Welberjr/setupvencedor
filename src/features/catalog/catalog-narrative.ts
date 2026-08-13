import type { CatalogItem } from './types'

type CatalogNarrative = {
  whatItIs: string
  whenToUse: string
  firstSteps: string[]
  teamUse: string
  impact: string
}

type TypeContext = {
  what: string
  use: string
  outcome: string
}

const typeContext: Record<string, TypeContext> = {
  skill: {
    what: 'uma habilidade reutilizável para orientar decisões técnicas recorrentes',
    use: 'quando a equipe precisa repetir um padrão com mais consistência',
    outcome: 'reduzindo retrabalho nas próximas entregas',
  },
  plugin: {
    what: 'uma extensão que adiciona capacidade ao fluxo de desenvolvimento',
    use: 'quando há uma etapa manual que pode ficar mais rápida sem perder controle',
    outcome: 'deixando o processo mais fluido',
  },
  mcp: {
    what: 'um conector que leva contexto e dados externos ao ambiente de trabalho',
    use: 'quando uma decisão depende de uma fonte confiável e atualizada',
    outcome: 'diminuindo suposições no dia a dia',
  },
  ferramenta: {
    what: 'uma ferramenta prática para destravar uma etapa do trabalho',
    use: 'quando existe um gargalo concreto e a equipe precisa testar uma alternativa',
    outcome: 'encurtando o caminho até uma decisão',
  },
  tutorial: {
    what: 'um roteiro guiado para aprender e aplicar uma prática',
    use: 'quando alguém precisa sair do zero com uma sequência clara',
    outcome: 'transformando teoria em uma primeira entrega',
  },
  referência: {
    what: 'um material de consulta para comparar caminhos com critério técnico',
    use: 'quando há alternativas suficientes para exigir uma escolha mais consciente',
    outcome: 'dando base para uma decisão bem documentada',
  },
  curso: {
    what: 'uma trilha de aprendizagem curta e aplicada',
    use: 'quando a equipe quer ampliar autonomia sem interromper a produção',
    outcome: 'criando repertório para os próximos projetos',
  },
}

function normalizeType(type: string) {
  return type.trim().toLocaleLowerCase('pt-BR')
}

function getContext(type: string): TypeContext {
  return typeContext[normalizeType(type)] ?? {
    what: 'um recurso técnico para apoiar uma etapa real do projeto',
    use: 'quando a equipe precisa de um ponto de partida confiável',
    outcome: 'dando mais clareza para a próxima ação',
  }
}

function firstReadableSentence(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length < 20) return null
  const sentence = normalized.match(/^(.{20,220}?[.!?])(?:\s|$)/)?.[1] ?? normalized.slice(0, 220)
  return sentence.replace(/[.!?]+$/, '')
}

function formatFocus(item: CatalogItem) {
  return item.topics.find(Boolean) ?? item.tags.find(Boolean) ?? 'o trabalho da equipe'
}

export function createCatalogNarrative(item: CatalogItem): CatalogNarrative {
  const context = getContext(item.type)
  const summary = firstReadableSentence(item.summary)
  const detail = firstReadableSentence(item.ownContent)
  const focus = formatFocus(item)
  const teamUse = firstReadableSentence(item.instructions) ?? `Teste ${item.title} em uma tarefa pequena, registre o resultado e compartilhe o padrão que funcionou com a equipe.`

  return {
    whatItIs: summary ? `${item.title} é ${context.what}. ${summary}.` : `${item.title} é ${context.what}.`,
    whenToUse: `${context.use}, especialmente em iniciativas de ${focus}.`,
    firstSteps: [
      'Abra a fonte oficial e confirme o propósito do recurso.',
      'Valide em uma tarefa pequena do projeto atual.',
      'Registre o que funcionou antes de transformar o uso em padrão.',
    ],
    teamUse: detail ? `${teamUse} Resultado esperado: ${detail}.` : teamUse,
    impact: `${item.title} ajuda a equipe a avançar com mais clareza, ${context.outcome}.`,
  }
}

export function createCardSummary(item: CatalogItem): string {
  const context = getContext(item.type)
  const summary = firstReadableSentence(item.summary)
  const opening = summary ? `${summary}.` : `${item.title} é ${context.what}.`
  return `${opening} Uma opção útil para ${context.outcome}.`
}
