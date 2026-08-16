import { useState, type FormEvent } from 'react'
import { TurnstileChallenge } from './TurnstileChallenge'

const communityUrl = 'https://chat.whatsapp.com/EoAKFGLW89h07VSXbzzrbr'
export const publicAccessTermsVersion = '2026-08-15'

export type PublicAccessSubmission = { fullName: string; email: string; phone: string; password: string; captchaToken: string; termsAccepted: true; termsVersion: typeof publicAccessTermsVersion }
type PublicAccessPageProps = {
  onLogin: (email: string, password: string, captchaToken: string) => Promise<void> | void
  onSignUp: (input: PublicAccessSubmission) => Promise<void> | void
  onForgotPassword?: (email: string, captchaToken: string) => Promise<void> | void
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function PublicAccessPage({ onLogin, onSignUp, onForgotPassword }: PublicAccessPageProps) {
  const [mode, setMode] = useState<'signup' | 'login' | 'recovery'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
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
    if (mode === 'signup' && !termsAccepted) return setMessage('Aceite os Termos de Uso e a Política de Privacidade para criar seu acesso.')
    if (!captchaToken) return setMessage('Conclua a verificação de segurança antes de continuar.')

    setMessage('')
    setIsSending(true)
    try {
      if (mode === 'signup') {
        await onSignUp({ captchaToken, fullName: fullName.trim(), email: normalizedEmail, phone: phone.trim(), password, termsAccepted: true, termsVersion: publicAccessTermsVersion })
        setMessage('Confirme seu e-mail para liberar o acesso. Enquanto isso, você já pode entrar na comunidade.')
      } else if (mode === 'login') await onLogin(normalizedEmail, password, captchaToken)
      else {
        await onForgotPassword?.(normalizedEmail, captchaToken)
        setMessage('Se este e-mail tiver uma conta, você receberá as instruções de recuperação.')
      }
    } catch (error) {
      const source = error instanceof Error ? error.message.toLowerCase() : ''
      setMessage(source.includes('captcha') ? 'Não foi possível validar a verificação de segurança. Tente novamente.' : source.includes('rate limit') || source.includes('too many requests') ? 'Aguarde alguns minutos antes de pedir outro e-mail de confirmação.' : source.includes('already registered') || source.includes('already been registered') ? 'Este e-mail já possui acesso. Entre com sua senha.' : mode === 'signup' ? 'Não foi possível criar seu acesso agora. Tente novamente em instantes.' : mode === 'login' ? 'E-mail ou senha incorretos.' : 'Não foi possível enviar a recuperação agora. Tente novamente em instantes.')
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
      <h2 id="public-access-title">{mode === 'signup' ? 'Entre sem pagar nada.' : mode === 'login' ? 'Que bom ter você de volta.' : 'Vamos recuperar seu acesso.'}</h2>
      <p className="public-access-lead">{mode === 'signup' ? 'Acesso 100% gratuito. Sem cartão, sem teste escondido e sem pegadinha.' : mode === 'login' ? 'Use o e-mail e a senha que você cadastrou.' : 'Confirme seu e-mail e receba um link seguro para definir uma nova senha.'}</p>
      {mode === 'signup' ? <label>Nome completo<input aria-label="Nome completo" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label> : null}
      <label>E-mail<input aria-label="E-mail" autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      {mode === 'signup' ? <label>Telefone <small>opcional</small><input aria-label="Telefone" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label> : null}
      {mode !== 'recovery' ? <label>Senha<input aria-label="Senha" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />{mode === 'signup' ? <small className="public-password-rule">Use pelo menos 8 caracteres, com letras e números.</small> : null}</label> : null}
      {mode === 'signup' ? <label className="public-access-consent"><input aria-label="Aceito os Termos de Uso e a Política de Privacidade" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" /><span>Li e aceito os <a href="https://www.setupvencedor.com.br/termos" rel="noreferrer" target="_blank">Termos de Uso</a> e a <a href="https://www.setupvencedor.com.br/privacidade" rel="noreferrer" target="_blank">Política de Privacidade</a>.</span></label> : null}
      <TurnstileChallenge action={mode} onTokenChange={setCaptchaToken} />
      {message ? <p aria-live="polite" className="public-access-message">{message}</p> : null}
      <button className="primary public-access-submit" disabled={isSending} type="submit">{isSending ? 'Só um instante…' : mode === 'signup' ? 'Criar meu acesso grátis' : mode === 'login' ? 'Entrar' : 'Enviar link de recuperação'}</button>
      {mode === 'signup' ? <button className="link-button public-access-switch" onClick={() => { setMode('login'); setCaptchaToken(''); setMessage('') }} type="button">Já tenho uma conta</button> : mode === 'login' ? <><button className="link-button public-access-switch" onClick={() => { setMode('signup'); setCaptchaToken(''); setMessage('') }} type="button">Quero criar meu acesso grátis</button><button className="link-button" onClick={() => { setMode('recovery'); setCaptchaToken(''); setMessage('') }} type="button">Esqueci minha senha</button></> : <button className="link-button public-access-switch" onClick={() => { setMode('login'); setCaptchaToken(''); setMessage('') }} type="button">Voltar para entrar</button>}
      <a className="public-community-link" href={communityUrl} rel="noreferrer" target="_blank">Comunidade no WhatsApp <span>↗</span></a>
    </form>
  </section>
}
