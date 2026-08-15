/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ORIGIN?: string
  readonly VITE_VISUAL_MODE?: string
  readonly VITE_WORKER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
