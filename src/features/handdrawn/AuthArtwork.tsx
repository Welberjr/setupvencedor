import { BrandMark } from '../brand/BrandMark'
import { getAreaIllustration } from './illustration-registry'

export function AuthArtwork() {
  const illustration = getAreaIllustration('auth')
  return (
    <aside aria-label="Boas-vindas ao acervo privado" className="handdrawn-auth-artwork">
      <header><BrandMark /><span>SETUP VENCEDOR</span></header>
      <div><p>ACERVO PRIVADO</p><h2>Seu caderno técnico está protegido.</h2><span>Entre para continuar sua trilha, rever favoritos e usar os guias desenhados.</span></div>
      <figure><img alt={illustration.alt} decoding="async" height="800" src={illustration.src} width="1200" /></figure>
      <ul aria-label="O que você encontra no acervo"><li>Fontes oficiais</li><li>Passos clicáveis</li><li>Prompts prontos</li></ul>
    </aside>
  )
}
