import { IllustratedHero } from './IllustratedHero'
import { getAreaIllustration } from './illustration-registry'

export function ExploreHero({ totalItems }: { totalItems: number }) {
  return (
    <IllustratedHero
      eyebrow="BEM-VINDO AO ACERVO"
      title="Escolha o próximo atalho técnico."
      description="Cada recurso vem com uma explicação humana, um caminho de uso e ações claras para começar sem travar."
      illustration={getAreaIllustration('explore')}
      aside={(
        <aside className="handdrawn-count-note">
          <small>SEU CADERNO</small>
          <strong>{totalItems} recursos para descobrir.</strong>
        </aside>
      )}
    />
  )
}
