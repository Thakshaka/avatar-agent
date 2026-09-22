import { useState } from 'react';
import { appConfig } from './config';

export function KayaAvatarPanel() {
  const [frameKey, setFrameKey] = useState(0);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const avatarUrl = `${appConfig.kayaUrl}/embed/${encodeURIComponent(
    appConfig.workspaceId,
  )}/${encodeURIComponent(appConfig.workflowId)}/avatar?theme=light`;

  const reloadAvatar = () => {
    setIsFrameLoading(true);
    setFrameKey((key) => key + 1);
  };

  return (
    <section className="avatar-panel" aria-label="Avatar conversation">
      <div className="frame-toolbar">
        <div className="frame-status">
          <span
            className={isFrameLoading ? 'status-dot loading' : 'status-dot'}
          />
          <span>{isFrameLoading ? 'Loading avatar' : 'Kaya embed ready'}</span>
        </div>
        <span className="mode-badge">Kaya</span>
        <button type="button" className="reload-button" onClick={reloadAvatar}>
          <ReloadIcon />
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
  );
}

function ReloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z" />
    </svg>
  );
}
