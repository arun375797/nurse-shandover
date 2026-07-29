/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin for split hosting, e.g. https://api.example.com (no trailing slash). Empty in local dev (Vite proxies /api). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
