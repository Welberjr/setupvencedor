import type { CatalogItem } from './types'

type CatalogNarrative = {
  whatItIs: string
  whenToUse: string
  firstStep: string
}

const typeContext: Record<string, { what: string; use: string }> = {
  skill: { what: 'uma instrução reutilizável que dá ao Claude Code um jeito mais consistente de executar uma tarefa específica', use: 'quando a equipe quiser reduzir tentativas, padronizar o resultado e levar conhecimento técnico para dentro do fluxo de trabalho' },
  plugin: { what: 'uma extensão que acrescenta uma capacidade ou um fluxo de trabalho ao ambiente do agente', use: 'quando o recurso se encaixar em uma rotina recorrente da equipe e houver um caso de uso claro para testar' },
  mcp: { what: 'um conector que permite ao agente consultar ou operar uma fonte externa de dados e ferramentas', use: 'quando o trabalho depender de documentação, navegação, dados ou uma integração que o agente não possui sozinho' },
  ferramenta: { what: 'uma aplicação ou projeto que pode apoiar uma etapa real da operação técnica', use: 'quando existir um problema prático a resolver e a equipe precisar avaliar compatibilidade, manutenção e custo' },
  tutorial: { what: 'um ponto de partida guiado para aprender ou configurar uma capacidade', use: 'quando alguém precisar sair do zero com segurança antes de aplicar a solução em um projeto' },
  referência: { what: 'uma fonte pública para estudo, comparação e tomada de decisão técnica', use: 'quando a equipe precisar entender alternativas antes de escolher uma direção' },
  referencia: { what: 'uma fonte pública para estudo, comparação e tomada de decisão técnica', use: 'quando a equipe precisar entender alternativas antes de escolher uma direção' },
  curso: { what: 'uma trilha de aprendizado que ajuda a equipe a desenvolver repertório prático', use: 'quando o objetivo for criar base antes de adotar novas ferramentas em entregas reais' },
}

export function createCatalogNarrative(item: CatalogItem): CatalogNarrative {
  const context = typeContext[item.type.toLowerCase()] ?? { what: 'um recurso técnico catalogado para avaliação da equipe', use: 'quando o assunto estiver relacionado ao problema que você precisa resolver' }
  const focus = item.topics.length ? ` O foco registrado para este item é ${item.topics.join(', ')}.` : ''
  return {
    whatItIs: `${item.title} e ${context.what}.${focus}`,
    whenToUse: `Use ${item.title} ${context.use}.`,
    firstStep: 'Comece pela fonte oficial, confirme requisitos e licença, e valide em um ambiente controlado antes de incorporar ao fluxo da equipe.',
  }
}
