const officialOrigin = 'https://setupvencedor.com.br'

export function normalizeAppOrigin(value?: string): string {
  return (value?.trim() || officialOrigin).replace(/\/$/, '')
}

export function appOrigin(): string {
  return normalizeAppOrigin(import.meta.env.VITE_APP_ORIGIN)
}

export function normalizeWorkerOrigin(value?: string): string {
  return value?.trim() ? value.trim().replace(/\/$/, '') : officialOrigin
}

export function workerOrigin(): string {
  return normalizeWorkerOrigin(import.meta.env.VITE_WORKER_URL || import.meta.env.VITE_APP_ORIGIN)
}
