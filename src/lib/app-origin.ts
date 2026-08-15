const officialOrigin = 'https://setupvencedor.com.br'

export function normalizeAppOrigin(value?: string): string {
  return (value?.trim() || officialOrigin).replace(/\/$/, '')
}

export function appOrigin(): string {
  return normalizeAppOrigin(import.meta.env.VITE_APP_ORIGIN)
}
