export type InvitationDelivery = 'email' | 'direct_link'

export type InviteInput = {
  delivery: InvitationDelivery
  email?: string
  recipientName?: string
  jobTitle?: string
  roles?: string[]
}

const allowedRoles = new Set(['admin', 'manager', 'editor', 'member'])

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid_email')
  return email
}

export function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized.slice(0, 120) : undefined
}

export function validateInviteInput(input: InviteInput) {
  if (!Array.isArray(input.roles) || input.roles.length === 0 || !input.roles.every((role) => allowedRoles.has(role))) {
    throw new Error('invalid_invitation')
  }
  if (input.delivery !== 'email' && input.delivery !== 'direct_link') throw new Error('invalid_invitation')

  const recipientName = normalizeOptionalText(input.recipientName)
  const jobTitle = normalizeOptionalText(input.jobTitle)
  if (input.delivery === 'email') {
    if (!input.email) throw new Error('invalid_invitation')
    return { delivery: input.delivery, email: normalizeEmail(input.email), recipientName, jobTitle, roles: input.roles }
  }
  return { delivery: input.delivery, recipientName, jobTitle, roles: input.roles }
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
