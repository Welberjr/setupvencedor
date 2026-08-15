export type ResourceProfilePilotStep = {
  title: string
  detail: string
  claudeLabel: 'Copiar para Claude Code'
  codexLabel: 'Copiar para Codex'
  claudePrompt: string
  codexPrompt: string
}

export type ResourceProfilePilot = {
  kind: 'editorial' | 'visual-steps'
  heading: string
  eyebrow: string
  steps: ResourceProfilePilotStep[]
}

const claudeLabel = 'Copiar para Claude Code' as const
const codexLabel = 'Copiar para Codex' as const

const frontendDesign: ResourceProfilePilot = {
  kind: 'editorial',
  heading: 'Da ideia à primeira tela',
  eyebrow: 'GUIA VISUAL DE EXECUÇÃO',
  steps: [
    { title: 'Defina a missão', detail: 'Diga para quem a tela existe e qual ação ela precisa facilitar.', claudeLabel, codexLabel, claudePrompt: 'Quero usar Frontend Design neste projeto. Antes de propor código, me ajude a definir o público e a ação principal desta tela.', codexPrompt: 'Antes de propor código para esta interface, me ajude a definir o público e a ação principal desta tela. Faça perguntas curtas se faltar contexto.' },
    { title: 'Dê um clima à interface', detail: 'Escolha três palavras que expliquem a sensação que a página precisa transmitir.', claudeLabel, codexLabel, claudePrompt: 'Com base no objetivo desta interface, proponha três palavras para o clima visual e justifique cada uma antes de alterar o código.', codexPrompt: 'Com base no objetivo desta interface, proponha três palavras para o clima visual e justifique cada uma antes de alterar o código.' },
    { title: 'Peça direção antes de código', detail: 'Valide cores, tipografia, hierarquia e ritmo antes de montar todos os componentes.', claudeLabel, codexLabel, claudePrompt: 'Leia a fonte oficial do Frontend Design e proponha uma direção visual para esta tela: cores, tipografia, hierarquia e ritmo. Não implemente ainda.', codexPrompt: 'Leia a fonte oficial do Frontend Design e proponha uma direção visual para esta tela: cores, tipografia, hierarquia e ritmo. Não implemente ainda.' },
    { title: 'Teste a primeira tela', detail: 'Construa só a seção principal e revise desktop e celular antes de repetir o padrão.', claudeLabel, codexLabel, claudePrompt: 'Implemente apenas a primeira seção da direção visual aprovada e valide desktop e celular antes de expandir a página.', codexPrompt: 'Implemente apenas a primeira seção da direção visual aprovada e valide desktop e celular antes de expandir a página.' },
  ],
}

const webDesignPremium: ResourceProfilePilot = {
  kind: 'visual-steps',
  heading: 'Construa com intenção',
  eyebrow: 'ROTEIRO VISUAL INTERATIVO',
  steps: [
    { title: 'Objetivo', detail: 'Liste a ação principal e o que a pessoa precisa entender em poucos segundos.', claudeLabel, codexLabel, claudePrompt: 'Quero trabalhar esta página com uma direção visual clara. Primeiro, ajude-me a definir a ação principal e o que a pessoa deve entender em poucos segundos.', codexPrompt: 'Quero trabalhar esta página com uma direção visual clara. Primeiro, ajude-me a definir a ação principal e o que a pessoa deve entender em poucos segundos.' },
    { title: 'Direção visual', detail: 'Traga uma referência de clima sem copiar marcas, páginas ou layouts de terceiros.', claudeLabel, codexLabel, claudePrompt: 'Com o objetivo definido, proponha uma direção visual original: tom, contraste, tipografia, espaços e movimento. Não copie referências de terceiros.', codexPrompt: 'Com o objetivo definido, proponha uma direção visual original: tom, contraste, tipografia, espaços e movimento. Não copie referências de terceiros.' },
    { title: 'Primeira seção', detail: 'Teste uma seção de destaque antes de repetir escolhas por toda a página.', claudeLabel, codexLabel, claudePrompt: 'Implemente uma única seção de destaque que expresse a direção visual aprovada. Preserve a funcionalidade existente e não expanda para o restante da página.', codexPrompt: 'Implemente uma única seção de destaque que expresse a direção visual aprovada. Preserve a funcionalidade existente e não expanda para o restante da página.' },
    { title: 'Revisão', detail: 'Confira clareza, contraste e comportamento em celular antes de levar o padrão adiante.', claudeLabel, codexLabel, claudePrompt: 'Revise esta primeira seção em desktop e celular. Aponte problemas de clareza, contraste e hierarquia antes de replicar o padrão.', codexPrompt: 'Revise esta primeira seção em desktop e celular. Aponte problemas de clareza, contraste e hierarquia antes de replicar o padrão.' },
  ],
}

export function getResourceProfilePilot(slug: string): ResourceProfilePilot | null {
  if (slug === 'skills-frontend-design') return frontendDesign
  if (slug === 'skills-web-design-premium') return webDesignPremium
  return null
}
