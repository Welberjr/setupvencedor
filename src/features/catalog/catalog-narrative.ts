import type { CatalogItem } from './types'

type CatalogNarrative = {
  whatItIs: string
  whenToUse: string
  firstStep: string
}

const typeContext: Record<string, { what: string; use: string }> = {
  skill: { what: 'uma instrucao reutilizavel que da ao Claude Code um jeito mais consistente de executar uma tarefa especifica', use: 'quando a equipe quiser reduzir tentativas, padronizar o resultado e levar conhecimento tecnico para dentro do fluxo de trabalho' },
  plugin: { what: 'uma extensao que acrescenta uma capacidade ou um fluxo de trabalho ao ambiente do agente', use: 'quando o recurso se encaixar em uma rotina recorrente da equipe e houver um caso de uso claro para testar' },
  mcp: { what: 'um conector que permite ao agente consultar ou operar uma fonte externa de dados e ferramentas', use: 'quando o trabalho depender de documentacao, navegacao, dados ou uma integracao que o agente nao possui sozinho' },
  ferramenta: { what: 'uma aplicacao ou projeto que pode apoiar uma etapa real da operacao tecnica', use: 'quando existir um problema pratico a resolver e a equipe precisar avaliar compatibilidade, manutencao e custo' },
  tutorial: { what: 'um ponto de partida guiado para aprender ou configurar uma capacidade', use: 'quando alguem precisar sair do zero com seguranca antes de aplicar a solucao em um projeto' },
  referência: { what: 'uma fonte publica para estudo, comparacao e tomada de decisao tecnica', use: 'quando a equipe precisar entender alternativas antes de escolher uma direcao' },
  referencia: { what: 'uma fonte publica para estudo, comparacao e tomada de decisao tecnica', use: 'quando a equipe precisar entender alternativas antes de escolher uma direcao' },
  curso: { what: 'uma trilha de aprendizado que ajuda a equipe a desenvolver repertorio pratico', use: 'quando o objetivo for criar base antes de adotar novas ferramentas em entregas reais' },
}

export function createCatalogNarrative(item: CatalogItem): CatalogNarrative {
  const context = typeContext[item.type.toLowerCase()] ?? { what: 'um recurso tecnico catalogado para avaliacao da equipe', use: 'quando o assunto estiver relacionado ao problema que voce precisa resolver' }
  const focus = item.topics.length ? ` O foco registrado para este item e ${item.topics.join(', ')}.` : ''
  return {
    whatItIs: `${item.title} e ${context.what}.${focus}`,
    whenToUse: `Use ${item.title} ${context.use}.`,
    firstStep: 'Comece pela fonte oficial, confirme requisitos e licenca, e valide em um ambiente controlado antes de incorporar ao fluxo da equipe.',
  }
}
