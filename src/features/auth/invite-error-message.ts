export function invitationErrorMessage(code: string | null) {
  if (code === 'invalid_or_expired_invitation') return 'Este convite já foi usado, revogado ou expirou. Peça um novo link ao administrador.'
  if (code === 'invalid_activation') return 'Confira seus dados e use uma senha forte com pelo menos 12 caracteres.'
  return 'Não conseguimos criar seu acesso agora. Tente novamente em alguns instantes sem fechar esta página.'
}
