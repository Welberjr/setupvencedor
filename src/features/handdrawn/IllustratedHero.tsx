import type { ReactNode } from 'react'
import type { HanddrawnIllustration } from './illustration-registry'

type IllustratedHeroProps = {
  eyebrow: string
  title: string
  description: string
  illustration: HanddrawnIllustration
  aside?: ReactNode
}

export function IllustratedHero({ eyebrow, title, description, illustration, aside }: IllustratedHeroProps) {
  return (
    <section className="illustrated-hero">
      <div className="illustrated-hero-copy">
        <p className="illustrated-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="illustrated-description">{description}</p>
        {aside}
      </div>
      <figure className="illustrated-hero-artwork">
        <img src={illustration.src} alt={illustration.alt} width="420" height="210" loading="eager" />
      </figure>
    </section>
  )
}
