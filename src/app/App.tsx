type Session = { user: { id: string; email: string } } | null

export function App({ session = null }: { session?: Session }) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/">Setup Vencedor</a>
        {session ? <span className="identity">{session.user.email}</span> : null}
      </header>
      <nav aria-label="Principal" className="main-nav">
        <a href="/explorar">Explorar</a>
        <a href="/assistente">Assistente</a>
        <a href="/favoritos">Favoritos</a>
        <a href="/suporte">Suporte</a>
      </nav>
      <section className="hero">
        <p className="eyebrow">CENTRAL DE CONHECIMENTO</p>
        <h1>Encontre a melhor ferramenta para o próximo passo.</h1>
      </section>
    </main>
  )
}
