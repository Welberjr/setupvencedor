export type Role = 'admin' | 'manager' | 'editor' | 'member'

export function hasAnyRole(roles: Role[], required: Role[]): boolean {
  return required.some((role) => roles.includes(role))
}
