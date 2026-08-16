export function authCallbackErrorMessage(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (!params.get('error')) return null
  return 'Não conseguimos confirmar seu e-mail desta vez. Solicite um novo e-mail de confirmação e tente novamente.'
}
