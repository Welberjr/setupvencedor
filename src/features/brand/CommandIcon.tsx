import type { ReactNode } from 'react'

export type CommandIconName = 'explore' | 'assistant' | 'favorites' | 'support' | 'admin' | 'close' | 'previous' | 'next' | 'arrow'

const iconPaths: Record<CommandIconName, ReactNode> = {
  explore: <><circle cx="12" cy="12" r="7" /><path d="m14.8 9.2-1.7 4.1-4.1 1.7 1.7-4.1 4.1-1.7Z" /></>,
  assistant: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" /><path d="m18.5 15 .6 2.9L22 18.5l-2.9.6-.6 2.9-.6-2.9-2.9-.6 2.9-.6.6-2.9Z" /></>,
  favorites: <path d="M12 20S4 15.2 4 9.3C4 6.9 5.8 5 8.2 5c1.6 0 3.1.9 3.8 2.2C12.7 5.9 14.2 5 15.8 5 18.2 5 20 6.9 20 9.3 20 15.2 12 20 12 20Z" />,
  support: <><circle cx="12" cy="12" r="7.5" /><path d="M8.5 10.5c.2-2.3 1.5-3.5 3.5-3.5 1.8 0 3.2 1.2 3.2 3 0 2.1-2.2 2.4-2.7 4" /><path d="M12.5 17h.01" /></>,
  admin: <><path d="M12 3 19 6v5c0 4.3-2.9 7.9-7 9.8C7.9 18.9 5 15.3 5 11V6l7-3Z" /><path d="M9.4 12.2 11.3 14l3.6-4" /></>,
  close: <><path d="m7 7 10 10M17 7 7 17" /></>,
  previous: <path d="m14.5 6-6 6 6 6" />,
  next: <path d="m9.5 6 6 6-6 6" />,
  arrow: <><path d="M4 7c3.5 0 3 8 7.3 8H18" /><path d="m14.5 11.5 3.5 3.5-3.5 3.5" /></>,
}

export function CommandIcon({ name, size = 18 }: { name: CommandIconName; size?: number }) {
  return <svg aria-hidden="true" className={`command-icon command-icon-${name}`} data-testid={`command-icon-${name}`} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name]}</svg>
}
