export type AvatarMode = 'kaya' | 'mock';

const DEFAULT_KAYA_URL = 'http://localhost:3000';
const DEFAULT_WORKSPACE_ID = 'c69c3a07-7977-4335-a27a-35dc8ba3d9bc';
const DEFAULT_WORKFLOW_ID = 'a3bb457b-dc72-4160-8074-fbb186860ff6';
const DEFAULT_MOCK_API_URL = 'http://localhost:8787';

const configuredMode = import.meta.env.VITE_AVATAR_MODE?.toLowerCase();

export const appConfig = {
  mode: (configuredMode === 'mock' ? 'mock' : 'kaya') as AvatarMode,
  kayaUrl: normalizeUrl(import.meta.env.VITE_KAYA_URL || DEFAULT_KAYA_URL),
  workspaceId:
    import.meta.env.VITE_KAYA_WORKSPACE_ID || DEFAULT_WORKSPACE_ID,
  workflowId: import.meta.env.VITE_KAYA_WORKFLOW_ID || DEFAULT_WORKFLOW_ID,
  mockApiUrl: normalizeUrl(
    import.meta.env.VITE_MOCK_API_URL || DEFAULT_MOCK_API_URL,
  ),
};

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '');
}
