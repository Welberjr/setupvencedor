/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VISUAL_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
