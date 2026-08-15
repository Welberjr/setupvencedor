import { useState, type FormEvent } from 'react'

const communityUrl = 'https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr'

type SignupInput = { fullName: string; email: string; phone: string; password: string }
type PublicAccessPageProps = {
  onLogin: (email: string, password: string) => Promise<void> | void
  onSignUp: (input: SignupInput) => Promise<void> | void
  onForgotPassword?: (email: string) => Promise<void> | void
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function PublicAccessPage({ onLogin, onSignUp, onForgotPassword }: PublicAccessPageProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!isEmail(normalizedEmail)) return setMessage('Informe um e-mail válido.')
    if (mode === 'signup' && fullName.trim().length < 2) return setMessage('Informe seu nome completo.')
    if (mode === 'signup' && password.length < 8) return setMessage('Crie uma senha com pelo menos 8 caracteres.')
    if (mode === 'signup' && (!/[A-Za-z]/.test(password) || !/\d/.test(password))) return setMessage('Use letras e números na sua senha.')
    if (mode === 'login' && !password) return setMessage('Informe sua senha.')

    setMessage('')
    setIsSending(true)
    try {
      if (mode === 'signup') {
        await onSignUp({ fullName: fullName.trim(), email: normalizedEmail, phone: phone.trim(), password })
        setMessage('Confirme seu e-mail para liberar o acesso. Enquanto isso, você já pode entrar na comunidade.')
      } else await onLogin(normalizedEmail, password)
    } catch (error) {
      const source = error instanceof Error ? error.message.toLowerCase() : ''
      setMessage(source.includes('already registered') || source.includes('already been registered') ? 'Este e-mail já possui acesso. Entre com sua senha.' : mode === 'signup' ? 'Não foi possível criar seu acesso agora. Tente novamente em instantes.' : 'E-mail ou senha incorretos.')
    } finally { setIsSending(false) }
  }

  return <section className="public-access" aria-labelledby="public-access-title">
    <div className="public-access-story" aria-hidden="true">
      <div className="public-access-sv">SV</div>
      <p>QUER QUE EU DESENHE?</p>
      <h1>Aprender a usar IA não precisa parecer um manual impossível.</h1>
      <span>Um acervo prático, explicado em passos claros, para você abrir, copiar e aplicar.</span>
      <div className="public-access-doodle"><b>1</b><i>⌁</i><b>2</b><i>↝</i><b>3</b></div>
    </div>
    <form className="public-access-form" onSubmit={submit} noValidate>
      <p className="eyebrow">SETUP VENCEDOR · ACESSO LIVRE</p>
      <h2 id="public-access-title">{mode === 'signup' ? 'Entre sem pagar nada.' : 'Que bom ter você de volta.'}</h2>
      <p className="public-access-lead">{mode === 'signup' ? 'Acesso 100% gratuito. Sem cartão, sem teste escondido e sem pegadinha.' : 'Use o e-mail e a senha que você cadastrou.'}</p>
      {mode === 'signup' ? <label>Nome completo<input aria-label="Nome completo" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label> : null}
      <label>E-mail<input aria-label="E-mail" autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      {mode === 'signup' ? <label>Telefone <small>opcional</small><input aria-label="Telefone" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label> : null}
      <label>Senha<input aria-label="Senha" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {message ? <p aria-live="polite" className="public-access-message">{message}</p> : null}
      <button className="primary public-access-submit" disabled={isSending} type="submit">{isSending ? 'Só um instante…' : mode === 'signup' ? 'Criar meu acesso grátis' : 'Entrar'}</button>
      {mode === 'signup' ? <button className="link-button public-access-switch" onClick={() => { setMode('login'); setMessage('') }} type="button">Já tenho uma conta</button> : <><button className="link-button public-access-switch" onClick={() => { setMode('signup'); setMessage('') }} type="button">Quero criar meu acesso grátis</button><button className="link-button" onClick={() => { if (!isEmail(email.trim())) setMessage('Informe seu e-mail para recuperar a senha.'); else void onForgotPassword?.(email.trim().toLowerCase()) }} type="button">Esqueci minha senha</button></>}
      <a className="public-community-link" href={communityUrl} rel="noreferrer" target="_blank">Comunidade no WhatsApp <span>↗</span></a>
    </form>
  </section>
}
