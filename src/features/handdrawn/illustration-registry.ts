export type HanddrawnArea = 'explore' | 'assistant' | 'favorites' | 'support' | 'admin' | 'auth'
export type HanddrawnIllustration = { src: string; alt: string }

const areaIllustrations: Record<HanddrawnArea, HanddrawnIllustration> = {
  explore: {
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Biblioteca desenhada com fichas, lupa, laptop e caminhos conectados',
  },
  assistant: {
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Caminhos desenhados entre recursos técnicos',
  },
  favorites: {
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Fichas técnicas organizadas em uma biblioteca desenhada',
  },
  support: {
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Ferramentas técnicas organizadas em uma mesa desenhada',
  },
  admin: {
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Biblioteca técnica desenhada e organizada',
  },
  auth: {
    src: '/illustrations/handdrawn/explore-library.png',
    alt: 'Entrada desenhada para uma biblioteca privada',
  },
}

export function getAreaIllustration(area: HanddrawnArea): HanddrawnIllustration {
  return areaIllustrations[area]
}
