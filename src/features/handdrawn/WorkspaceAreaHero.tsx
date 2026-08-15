import { IllustratedHero } from './IllustratedHero'
import { getAreaIllustration, type HanddrawnArea } from './illustration-registry'

type WorkspaceArea = Exclude<HanddrawnArea, 'explore' | 'auth'>

const areaCopy: Record<WorkspaceArea, { eyebrow: string; title: string; note: string }> = {
  assistant: { eyebrow: 'DESENHE A PRÓXIMA TRILHA', title: 'O que você precisa construir?', note: 'Conte o destino. O acervo ajuda a ligar os pontos.' },
  favorites: { eyebrow: 'SEU CADERNO DE ATALHOS', title: 'Seus atalhos favoritos.', note: 'Guarde o que merece voltar para a sua mesa.' },
  support: { eyebrow: 'VAMOS DESTRAVAR JUNTOS', title: 'Como podemos ajudar?', note: 'Explique o ponto em que a trilha parou.' },
  admin: { eyebrow: 'BASTIDORES DO ACERVO', title: 'Controle da sua biblioteca.', note: 'Acessos, convites e recursos no mesmo mapa.' },
}

export function WorkspaceAreaHero({ area, description }: { area: WorkspaceArea; description: string }) {
  const copy = areaCopy[area]
  return (
    <IllustratedHero
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={description}
      illustration={getAreaIllustration(area)}
      aside={<aside className="handdrawn-area-note">{copy.note}</aside>}
    />
  )
}
