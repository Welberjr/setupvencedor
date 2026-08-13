import type { ReactNode } from 'react'

export type CommandIconName = 'explore' | 'assistant' | 'favorites' | 'support' | 'admin' | 'close' | 'previous' | 'next' | 'arrow'

const iconPaths: Record<CommandIconName, ReactNode> = {
  explore: <><path d="M4.5 14.1c.1-5.3 3.1-8.8 8.1-9.5 4.3-.6 7.1 1.4 6.9 4.5-.2 3.6-3.6 5.8-8.4 6.1-2.5.2-3.8 1.1-4.1 3.1" /><path d="m15.4 6.8 3.8 2.1-3.1 2.8" /><path d="m7.5 17.2 2.4 2.3-3.2.9" /><circle cx="12" cy="12" r="1.45" /></>,
  assistant: <><path d="m7.1 15.8 2.7-7 2.1 4.1 4.5-1.8" /><path d="m7.2 15.7 2.9 1.3" /><path d="m16.4 10.9 2.1-2.1" /><path d="m9.8 5.1.8 2.3" /><path d="m17.8 14.2.8 2.4" /><path d="m13.9 4.2.4 1.4" /><circle cx="7" cy="16" r="1.5" /><circle cx="10" cy="8" r="1.5" /><circle cx="16.5" cy="11" r="1.5" /><circle cx="18.8" cy="16.8" r="1.25" /></>,
  favorites: <><path d="M12 20.1c-1.8-2.2-6.9-4.7-7.4-8.8-.3-2.7 1.4-4.9 4-5.1 1.8-.1 3 1 3.8 2.3.8-1.3 2-2.4 3.8-2.3 2.6.2 4.3 2.4 4 5.1-.5 4.1-5.6 6.6-7.4 8.8Z" /><path d="m8.5 8.2 3.5 4.2 3.5-4.2" /><path d="m12 12.4v5.2" /></>,
  support: <><path d="M5.3 7.6c1.8-2.6 4.4-3.8 7.2-3.4 3.8.5 6.3 3.1 6.3 6.6 0 3.8-3.1 6.9-7 6.9-1.1 0-2.2-.2-3.2-.7L5 19l1-3.3c-1-1.3-1.5-2.9-1.4-4.5" /><path d="M8.2 10.8c1.1-1.5 2.5-2.2 3.9-2.1 1.6.1 2.8.9 3.7 2.5" /><path d="M8.2 13.6c1.1 1.2 2.4 1.8 3.9 1.8 1.4 0 2.6-.5 3.5-1.6" /><circle cx="9.4" cy="11.7" r=".65" fill="currentColor" stroke="none" /><circle cx="14.7" cy="11.7" r=".65" fill="currentColor" stroke="none" /></>,
  admin: <><path d="M12 3.8 18.6 6v5.3c0 4.1-2.5 7.3-6.6 8.9-4.1-1.6-6.6-4.8-6.6-8.9V6L12 3.8Z" /><path d="M8.6 11.8 11 14l4.5-4.7" /><path d="M8.1 7.6 12 6.1l3.9 1.5" /></>,
  close: <><path d="m7 7 10 10M17 7 7 17" /></>,
  previous: <path d="m14.5 6-6 6 6 6" />,
  next: <path d="m9.5 6 6 6-6 6" />,
  arrow: <><defs><linearGradient id="detail-arrow-light" x1="3" x2="16" y1="6" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#edff6e" /><stop offset=".5" stopColor="#b7ff32" /><stop offset="1" stopColor="#61c917" /></linearGradient><linearGradient id="detail-arrow-shadow" x1="3" x2="14" y1="12" y2="18" gradientUnits="userSpaceOnUse"><stop stopColor="#4d9213" /><stop offset="1" stopColor="#1d4e10" /></linearGradient></defs><path d="M20.5 12h-10" stroke="#8be52a" strokeWidth="2.4" /><path d="m11.4 6.3-8.4 5.7 8.4 5.7-2-5.7 2-5.7Z" data-testid="detail-arrow-light-face" fill="url(#detail-arrow-light)" stroke="none" /><path d="m9.4 12H3l8.4 5.7-2-5.7Z" data-testid="detail-arrow-shadow-face" fill="url(#detail-arrow-shadow)" stroke="none" /></>,
}

export function CommandIcon({ name, size = 18 }: { name: CommandIconName; size?: number }) {
  return <svg aria-hidden="true" className={`command-icon command-icon-${name}`} data-direction={name === 'arrow' ? 'left' : undefined} data-testid={`command-icon-${name}`} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>
}
