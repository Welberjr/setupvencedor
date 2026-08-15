import type { ReactNode } from 'react'

export type CommandIconName = 'explore' | 'assistant' | 'agent' | 'favorites' | 'support' | 'admin' | 'close' | 'previous' | 'next' | 'arrow'

const iconPaths: Record<CommandIconName, ReactNode> = {
  explore: <g data-testid="explore-library-lens"><path d="M5.1 7.1 15.2 5.4l2.1 10.2-10.1 1.8z" /><path d="m7.1 5.8 9.7-1.7 1.4 6.4" /><path d="m7.7 9.1 5.5-1" /><path d="m8.3 12.2 3.8-.7" /><circle cx="15.5" cy="15.3" r="3.4" /><path d="m18 17.8 2.2 2.2" /><path d="m18.7 7 1.6-.8M20 10.1l1.5.5" /></g>,
  assistant: <g data-testid="assistant-idea-bubble"><path d="M4.4 7.7c.5-2.5 2.8-4.1 5.9-4.1 3.7 0 6.2 2 6.2 4.9 0 2.8-2.5 4.9-6.2 4.9-.9 0-1.8-.1-2.6-.4l-3.2 1 .9-2.7c-.7-.9-1.1-2.1-1-3.6" /><path d="M8.1 8.6h4.8M9.7 10.8h2.8" /><path d="m18.4 4.2.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" /><path d="m16.8 14.5.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" /></g>,
  agent: <g data-testid="agent-connection-cube"><path d="M5.3 7.5 11.8 4l6.9 3.8v7.7L12 20l-6.7-3.7V8.1Z" /><path d="m5.5 8 6.4 3.7L18.5 8" /><path d="M11.9 11.8V20" /><path d="m8.5 5.8 3.4 1.9 3.5-1.9" /><circle cx="11.9" cy="11.8" r="1.25" fill="currentColor" stroke="none" /><path d="m4.2 14.8 1.7.4M18.3 14.8l1.7.4" /></g>,
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
