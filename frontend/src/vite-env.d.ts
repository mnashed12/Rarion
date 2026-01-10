/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AWS_S3_BUCKET_URL: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_DEFAULT_PAGE_SIZE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
