import { useMemo, useState } from 'react';

const DEFAULT_KAYA_URL = 'http://localhost:3000';
const DEFAULT_WORKSPACE_ID = 'c69c3a07-7977-4335-a27a-35dc8ba3d9bc';
const DEFAULT_WORKFLOW_ID = 'a3bb457b-dc72-4160-8074-fbb186860ff6';

function readConfig() {
  return {
    kayaUrl: (import.meta.env.VITE_KAYA_URL || DEFAULT_KAYA_URL).replace(/\/+$/, ''),
    workspaceId: import.meta.env.VITE_KAYA_WORKSPACE_ID || DEFAULT_WORKSPACE_ID,
    workflowId: import.meta.env.VITE_KAYA_WORKFLOW_ID || DEFAULT_WORKFLOW_ID,
  };
}

function App() {
  const config = useMemo(readConfig, []);
  const [frameKey, setFrameKey] = useState(0);
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  const avatarUrl = `${config.kayaUrl}/embed/${encodeURIComponent(
    config.workspaceId,
  )}/${encodeURIComponent(config.workflowId)}/avatar?theme=light`;

  const reloadAvatar = () => {
    setIsFrameLoading(true);
    setFrameKey((key) => key + 1);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Kaya Avatar home">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <span>Kaya Avatar</span>
        </a>
        <span className="secure-label">
          <span className="secure-dot" aria-hidden="true" />
          Secure conversation
        </span>
      </header>

      <main className="page-content">
        <section className="intro-panel">
          <div>
            <p className="eyebrow">AI VIDEO ASSISTANT</p>
            <h1>Talk naturally.<br />Get answers instantly.</h1>
            <p className="intro-copy">
              Start a real-time conversation with our AI assistant. Ask a
              question using your voice and receive a personal video response.
            </p>
          </div>

          <ol className="conversation-steps" aria-label="How to start">
            <li>
              <span>1</span>
              <div>
                <strong>Connect</strong>
                <p>Start the secure avatar session.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Allow microphone access</strong>
                <p>Your microphone lets the assistant hear you.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Start speaking</strong>
                <p>Talk as you would in a normal conversation.</p>
              </div>
            </li>
          </ol>

          <div className="privacy-note">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 5 6v5c0 4.55 2.99 8.74 7 10 4.01-1.26 7-5.45 7-10V6l-7-3Zm0 2.18 5 2.14V11c0 3.45-2.17 6.79-5 7.92C9.17 17.79 7 14.45 7 11V7.32l5-2.14Zm-1 4.32v4h2v-4h-2Zm0 5.5v2h2v-2h-2Z" />
            </svg>
            <p>
              <strong>Your privacy matters.</strong>
              Avoid sharing passwords, payment information, or other sensitive
              personal data during the conversation.
            </p>
          </div>
        </section>

        <section className="avatar-panel" aria-label="Avatar conversation">
          <div className="frame-toolbar">
            <div className="frame-status">
              <span className={isFrameLoading ? 'status-dot loading' : 'status-dot'} />
              <span>{isFrameLoading ? 'Loading avatar' : 'Avatar ready'}</span>
            </div>
            <button type="button" className="reload-button" onClick={reloadAvatar}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z" />
              </svg>
              Reload
            </button>
          </div>

          <div className="iframe-stage">
            {isFrameLoading && (
              <div className="frame-loader" aria-live="polite">
                <span className="spinner" />
                <p>Preparing your avatar…</p>
              </div>
            )}
            <iframe
              key={frameKey}
              src={avatarUrl}
              title="Kaya Avatar conversation"
              allow="camera; microphone; autoplay; clipboard-read; clipboard-write; display-capture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setIsFrameLoading(false)}
            />
          </div>
        </section>
      </main>

      <footer>
        Powered by <strong>Kaya AI</strong>
      </footer>
    </div>
  );
}

export default App;
