/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_KURIKULUM_ID: string
  readonly VITE_KURIKULUM_TITLE: string
  readonly VITE_KURIKULUM_MIN_SKS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
