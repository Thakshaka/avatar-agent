/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAYA_URL?: string;
  readonly VITE_KAYA_WORKSPACE_ID?: string;
  readonly VITE_KAYA_WORKFLOW_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
