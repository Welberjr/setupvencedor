import { hasAnyRole, type Role } from '../../lib/roles'

export type TicketStatus = 'open' | 'answered' | 'closed' | 'finalized'

const transitions: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ['answered', 'closed'],
  answered: ['closed'],
  closed: ['open', 'finalized'],
  finalized: [],
}

export function canTransitionTicket(
  status: TicketStatus,
  next: TicketStatus,
  roles: Role[],
): boolean {
  return hasAnyRole(roles, ['admin', 'manager']) && transitions[status].includes(next)
}
