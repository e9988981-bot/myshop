/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE: string;
  readonly PUBLIC_SHOP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
