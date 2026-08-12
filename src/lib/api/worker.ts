const fallbackWorkerUrl = 'https://setup-vencedor-worker.filmesecia-df.workers.dev'

export function workerUrl(path: string): string {
  return `${(import.meta.env.VITE_WORKER_URL ?? fallbackWorkerUrl).replace(/\/$/, '')}${path}`
}
