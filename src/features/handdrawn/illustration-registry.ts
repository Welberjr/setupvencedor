export type HanddrawnArea = 'explore' | 'assistant' | 'favorites' | 'support' | 'admin' | 'auth'
export type HanddrawnIllustration = { src: string; alt: string }

const areaIllustrations: Record<HanddrawnArea, HanddrawnIllustration> = {
  explore: {
    src: '/illustrations/handdrawn/explore-library.webp',
    alt: 'Biblioteca desenhada com fichas, lupa, laptop e caminhos conectados',
  },
  assistant: {
    src: '/illustrations/handdrawn/categories/agents-orchestration.webp',
    alt: 'Agentes e tarefas ligados por setas em um mapa desenhado à mão',
  },
  favorites: {
    src: '/illustrations/handdrawn/categories/guides-notebook.webp',
    alt: 'Caderno desenhado à mão com fichas, favoritos e marcadores coloridos',
  },
  support: {
    src: '/illustrations/handdrawn/categories/tools-workbench.webp',
    alt: 'Bancada de suporte desenhada à mão com ferramentas e checklist',
  },
  admin: {
    src: '/illustrations/handdrawn/categories/cloud-infrastructure.webp',
    alt: 'Biblioteca privada desenhada à mão como uma infraestrutura conectada',
  },
  auth: {
    src: '/illustrations/handdrawn/categories/quality-shield.webp',
    alt: 'Escudo desenhado à mão protegendo a entrada da biblioteca privada',
  },
}

export function getAreaIllustration(area: HanddrawnArea): HanddrawnIllustration {
  return areaIllustrations[area]
}
