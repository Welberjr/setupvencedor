import type { CatalogGuide } from './catalog-guide'
import { getResourceProfilePilot } from './resource-profile-pilots'
import type { CatalogItem } from './types'

export type ResourceEditorialStep = {
  title: string
  detail: string
  claudePrompt: string
  codexPrompt: string
}

export type ResourceEditorial = {
  eyebrow: string
  heading: string
  introduction: string
  illustration: { src: string; alt: string }
  steps: ResourceEditorialStep[]
}

type CategoryEditorial = Pick<ResourceEditorial, 'eyebrow' | 'heading' | 'introduction' | 'illustration'>

const categoryEditorials: Record<string, CategoryEditorial> = {
  Skills: {
    eyebrow: 'MAPA DE PRÁTICA', heading: 'Transforme intenção em prática', introduction: 'Um caminho curto para entender a habilidade, testá-la em contexto e registrar o padrão que funcionou.',
    illustration: { src: '/illustrations/handdrawn/categories/skills-workshop.webp', alt: 'Bancada desenhada à mão com fichas, lápis e um mapa de prática' },
  },
  MCPs: {
    eyebrow: 'MAPA DE CONEXÃO', heading: 'Conecte contexto ao trabalho', introduction: 'Um roteiro visual para conferir a fonte, conectar o contexto certo e validar a primeira consulta.',
    illustration: { src: '/illustrations/handdrawn/categories/mcps-connections.webp', alt: 'Conexões desenhadas à mão entre documentos, ferramentas e um computador' },
  },
  Plugins: {
    eyebrow: 'MAPA DE EXTENSÃO', heading: 'Acople a capacidade certa', introduction: 'Veja o que o plugin acrescenta, confirme o método oficial e teste apenas a menor mudança útil.',
    illustration: { src: '/illustrations/handdrawn/categories/plugins-toolbox.webp', alt: 'Caixa de ferramentas desenhada à mão com peças de plugin' },
  },
  Ferramentas: {
    eyebrow: 'MAPA DE DECISÃO', heading: 'Escolha, teste e decida', introduction: 'Entenda o gargalo, experimente a ferramenta em pequena escala e compare o resultado antes de adotá-la.',
    illustration: { src: '/illustrations/handdrawn/categories/tools-workbench.webp', alt: 'Bancada desenhada à mão com ferramentas técnicas e checklist' },
  },
  Cursos: {
    eyebrow: 'MAPA DE APRENDIZAGEM', heading: 'Aprenda fazendo', introduction: 'Transforme o conteúdo em uma trilha curta, com uma aplicação prática antes de avançar para a próxima etapa.',
    illustration: { src: '/illustrations/handdrawn/categories/courses-learning-path.webp', alt: 'Trilha de aprendizagem desenhada à mão com livros e marcos' },
  },
  'Guias e referências': {
    eyebrow: 'MAPA DE CONSULTA', heading: 'Consulte, compare e aplique', introduction: 'Use a referência para tomar uma decisão concreta e registre por que o caminho escolhido faz sentido.',
    illustration: { src: '/illustrations/handdrawn/categories/guides-notebook.webp', alt: 'Caderno de referências desenhado à mão com notas e marcadores' },
  },
  'IA e agentes': {
    eyebrow: 'MAPA DE ORQUESTRAÇÃO', heading: 'Orquestre o próximo passo', introduction: 'Defina a missão do agente, limite o primeiro movimento e confira o resultado antes de ampliar a autonomia.',
    illustration: { src: '/illustrations/handdrawn/categories/agents-orchestration.webp', alt: 'Agentes e tarefas conectados em um mapa desenhado à mão' },
  },
  'Cloud e infraestrutura': {
    eyebrow: 'MAPA DE INFRAESTRUTURA', heading: 'Suba com segurança', introduction: 'Entenda a peça de infraestrutura, valide dependências e faça uma primeira entrega reversível.',
    illustration: { src: '/illustrations/handdrawn/categories/cloud-infrastructure.webp', alt: 'Infraestrutura em nuvem desenhada à mão com servidores e conexões' },
  },
  'Qualidade e segurança': {
    eyebrow: 'MAPA DE PROTEÇÃO', heading: 'Proteja antes de publicar', introduction: 'Aplique o recurso como uma barreira de qualidade, verifique evidências e só então avance para a entrega.',
    illustration: { src: '/illustrations/handdrawn/categories/quality-shield.webp', alt: 'Escudo e checklist de qualidade desenhados à mão' },
  },
  Tutoriais: {
    eyebrow: 'MAPA PASSO A PASSO', heading: 'Siga o caminho visual', introduction: 'Percorra o tutorial em etapas pequenas, confirme cada resultado e pare quando o contexto divergir da fonte.',
    illustration: { src: '/illustrations/handdrawn/categories/tutorials-roadmap.webp', alt: 'Roteiro passo a passo desenhado à mão com setas e marcos' },
  },
}

const defaultEditorial: CategoryEditorial = {
  eyebrow: 'MAPA DE EXECUÇÃO', heading: 'Entenda, teste e registre', introduction: 'Um caminho visual para transformar a fonte oficial em uma primeira ação segura.',
  illustration: { src: '/illustrations/handdrawn/explore-library.webp', alt: 'Biblioteca técnica organizada em um mapa desenhado à mão' },
}

function promptFor(item: CatalogItem, detail: string, agent: 'Claude Code' | 'Codex') {
  return `Quero aplicar ${item.title} neste projeto usando ${agent}. Consulte primeiro a fonte oficial em ${item.officialUrl}. Nesta etapa, ${detail} Preserve o que já funciona, não invente comandos e pare para explicar se a fonte não confirmar o próximo passo.`
}

export function createResourceEditorial(item: CatalogItem, guide: CatalogGuide): ResourceEditorial {
  const custom = getResourceProfilePilot(item.slug)
  if (custom) {
    return {
      eyebrow: custom.eyebrow,
      heading: custom.heading,
      introduction: custom.kind === 'editorial' ? 'Um mapa prático para sair do briefing e chegar a uma primeira tela com intenção.' : 'Escolha uma etapa, execute o menor próximo passo e só então avance.',
      illustration: item.slug === 'skills-frontend-design'
        ? { src: '/illustrations/frontend-design-handdrawn-guide.webp', alt: 'Ilustração desenhada à mão sobre Frontend Design' }
        : categoryEditorials[item.category]?.illustration ?? defaultEditorial.illustration,
      steps: custom.steps.map((step) => ({ title: step.title, detail: step.detail, claudePrompt: step.claudePrompt, codexPrompt: step.codexPrompt })),
    }
  }

  const category = categoryEditorials[item.category] ?? defaultEditorial
  const details = [
    { title: 'Entenda o recurso', detail: guide.plainLanguage },
    { title: 'Veja quando ele brilha', detail: guide.whenToUse },
    { title: 'Faça o primeiro teste', detail: guide.firstSteps[0] ?? `Abra a fonte oficial de ${item.title}.` },
    { title: 'Registre o resultado', detail: guide.firstSteps.slice(1).join(' ') || `Registre o que funcionou antes de transformar ${item.title} em padrão.` },
  ]

  return {
    ...category,
    steps: details.map((step) => ({
      ...step,
      claudePrompt: promptFor(item, step.detail, 'Claude Code'),
      codexPrompt: promptFor(item, step.detail, 'Codex'),
    })),
  }
}
