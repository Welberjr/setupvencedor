const communityUrl = 'https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr'

export function CommunityWelcomePrompt({ onClose }: { onClose: () => void }) {
  return <div aria-labelledby="community-welcome-title" className="community-welcome-backdrop" role="presentation">
    <section aria-label="Convite para a Comunidade WhatsApp" className="community-welcome-dialog" role="dialog">
      <p className="eyebrow">SEU PRÓXIMO ATALHO</p>
      <span aria-hidden="true" className="community-welcome-mark">◔</span>
      <h2 id="community-welcome-title">Você não precisa aprender sozinho.</h2>
      <p>Entre na comunidade para receber novidades, trocar ideias e acompanhar os próximos recursos do acervo.</p>
      <a href={communityUrl} rel="noreferrer" target="_blank">Entrar na comunidade do WhatsApp ↗</a>
      <button onClick={onClose} type="button">Agora não, quero explorar</button>
    </section>
  </div>
}
