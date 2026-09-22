import { lazy, Suspense } from 'react';
import { KayaAvatarPanel } from './KayaAvatarPanel';
import { appConfig } from './config';

const DirectTavusPanel = lazy(() => import('./DirectTavusPanel'));

function App() {
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
            <h1>
              Talk naturally.
              <br />
              Get answers instantly.
            </h1>
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

        {appConfig.mode === 'mock' ? (
          <Suspense fallback={<PanelLoading />}>
            <DirectTavusPanel />
          </Suspense>
        ) : (
          <KayaAvatarPanel />
        )}
      </main>

      <footer>
        Powered by <strong>Kaya AI</strong>
      </footer>
    </div>
  );
}

function PanelLoading() {
  return (
    <section className="avatar-panel" aria-label="Loading Tavus client">
      <div className="direct-stage">
        <div className="frame-loader">
          <span className="spinner" />
          <p>Loading Daily video client…</p>
        </div>
      </div>
    </section>
  );
}

export default App;
