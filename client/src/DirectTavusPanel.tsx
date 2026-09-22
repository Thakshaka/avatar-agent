import {
  DailyAudio,
  DailyProvider,
  DailyVideo,
  useDaily,
  useParticipantIds,
} from '@daily-co/daily-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { appConfig } from './config';

const TAVUS_REPLICA_USER_ID = 'tavus-replica';
const DURATION_OPTIONS = [
  { label: '1 minute', seconds: 60 },
  { label: '5 minutes', seconds: 300 },
  { label: '10 minutes', seconds: 600 },
  { label: '15 minutes', seconds: 900 },
];

type SessionStatus =
  | 'idle'
  | 'creating'
  | 'joining'
  | 'connected'
  | 'ending'
  | 'error';

interface ConversationResponse {
  conversationId: string;
  conversationUrl: string;
  maxCallDurationSeconds?: number;
  expiresAt?: string;
}

type DailyEventHandler = Parameters<
  NonNullable<ReturnType<typeof useDaily>>['on']
>[1];

export function DirectTavusPanel() {
  return (
    <DailyProvider>
      <DirectTavusSession />
    </DailyProvider>
  );
}

export default DirectTavusPanel;

function DirectTavusSession() {
  const daily = useDaily();
  const replicaParticipantIds = useParticipantIds({
    filter: (participant) =>
      participant.user_id === TAVUS_REPLICA_USER_ID,
  });
  const replicaSessionId = replicaParticipantIds[0];

  const [status, setStatus] = useState<SessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedDurationSeconds, setSelectedDurationSeconds] = useState(300);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const endingRef = useRef(false);
  const expiresAtRef = useRef<number | null>(null);

  const clearSessionState = useCallback(() => {
    conversationIdRef.current = null;
    expiresAtRef.current = null;
    endingRef.current = false;
    setRemainingSeconds(null);
    setIsMuted(false);
  }, []);

  const endConversation = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setStatus('ending');

    const conversationId = conversationIdRef.current;
    if (conversationId) {
      try {
        await fetch(
          `${appConfig.mockApiUrl}/api/conversations/${encodeURIComponent(
            conversationId,
          )}/end`,
          {
            method: 'POST',
            keepalive: true,
          },
        );
      } catch {
        // Leaving the Daily room is still required when the provider call fails.
      }
    }

    try {
      await daily?.leave();
    } catch {
      // The room may already have ended on the Tavus side.
    }

    clearSessionState();
    setError(null);
    setStatus('idle');
  }, [clearSessionState, daily]);

  const startConversation = useCallback(async () => {
    if (!daily || status === 'creating' || status === 'joining') return;

    setError(null);
    setStatus('creating');

    try {
      const response = await fetch(
        `${appConfig.mockApiUrl}/api/conversations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationSeconds: selectedDurationSeconds,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as Partial<
        ConversationResponse & { error: string }
      >;

      if (!response.ok) {
        throw new Error(data.error || `Mock backend returned ${response.status}.`);
      }
      if (!data.conversationId || !data.conversationUrl) {
        throw new Error('Mock backend returned an invalid conversation.');
      }

      conversationIdRef.current = data.conversationId;
      if (data.maxCallDurationSeconds) {
        const serverExpiry = data.expiresAt
          ? Date.parse(data.expiresAt)
          : Number.NaN;
        expiresAtRef.current = Number.isFinite(serverExpiry)
          ? serverExpiry
          : Date.now() + data.maxCallDurationSeconds * 1000;
        setRemainingSeconds(data.maxCallDurationSeconds);
      }

      setStatus('joining');
      await daily.join({
        url: data.conversationUrl,
        startVideoOff: true,
      });
      setStatus('connected');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not start the Tavus conversation.';
      setError(message);
      setStatus('error');
    }
  }, [daily, selectedDurationSeconds, status]);

  const toggleMicrophone = useCallback(() => {
    daily?.setLocalAudio(isMuted);
    setIsMuted((muted) => !muted);
  }, [daily, isMuted]);

  useEffect(() => {
    if (!daily) return;

    const onDailyError = (event: { errorMsg?: string }) => {
      setError(event.errorMsg || 'The Daily call encountered an error.');
      setStatus('error');
    };
    const onLeftMeeting = () => {
      if (!endingRef.current && conversationIdRef.current) {
        clearSessionState();
        setStatus('idle');
      }
    };

    daily.on('error', onDailyError as DailyEventHandler);
    daily.on('left-meeting', onLeftMeeting as DailyEventHandler);

    return () => {
      daily.off('error', onDailyError as DailyEventHandler);
      daily.off('left-meeting', onLeftMeeting as DailyEventHandler);
    };
  }, [clearSessionState, daily]);

  useEffect(() => {
    if (status !== 'connected' || !expiresAtRef.current) return;

    const updateCountdown = () => {
      const seconds = Math.max(
        0,
        Math.ceil((expiresAtRef.current! - Date.now()) / 1000),
      );
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        void endConversation();
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 500);
    return () => window.clearInterval(timer);
  }, [endConversation, status]);

  useEffect(() => {
    const endOnPageHide = () => {
      const conversationId = conversationIdRef.current;
      if (!conversationId) return;
      navigator.sendBeacon(
        `${appConfig.mockApiUrl}/api/conversations/${encodeURIComponent(
          conversationId,
        )}/end`,
      );
    };

    window.addEventListener('pagehide', endOnPageHide);
    return () => window.removeEventListener('pagehide', endOnPageHide);
  }, []);

  const isBusy =
    status === 'creating' || status === 'joining' || status === 'ending';
  const isConnected = status === 'connected';

  return (
    <section className="avatar-panel" aria-label="Direct Tavus conversation">
      <div className="frame-toolbar">
        <div className="frame-status">
          <span
            className={`status-dot ${
              isBusy ? 'loading' : isConnected ? '' : 'inactive'
            }`}
          />
          <span>{getStatusLabel(status, Boolean(replicaSessionId))}</span>
        </div>
        <span className="mode-badge mock">Direct Tavus</span>
        {remainingSeconds !== null && isConnected && (
          <span
            className={`call-timer ${
              remainingSeconds <= 60 ? 'ending-soon' : ''
            }`}
          >
            {formatDuration(remainingSeconds)}
          </span>
        )}
      </div>

      <div className="direct-stage">
        {!isConnected ? (
          <div className="direct-empty-state">
            <div className="avatar-orb" aria-hidden="true">
              <span />
            </div>
            <p className="direct-eyebrow">DIRECT TAVUS MODE</p>
            <h2>Ready when you are</h2>
            <p>
              Start a secure Daily room directly through the local mock backend.
            </p>

            <label className="duration-picker">
              <span>Conversation duration</span>
              <select
                value={selectedDurationSeconds}
                onChange={(event) =>
                  setSelectedDurationSeconds(Number(event.target.value))
                }
                disabled={isBusy}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.seconds} value={option.seconds}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>The room will close automatically at this limit.</small>
            </label>

            {error && <div className="direct-error">{error}</div>}

            <button
              type="button"
              className="connect-button"
              onClick={() => void startConversation()}
              disabled={isBusy}
            >
              {isBusy ? (
                <>
                  <span className="button-spinner" />
                  {status === 'joining' ? 'Joining room…' : 'Starting…'}
                </>
              ) : (
                <>
                  <CameraIcon />
                  Start conversation
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {replicaSessionId && (
              <DailyVideo
                sessionId={replicaSessionId}
                type="video"
                fit="cover"
                className="direct-video"
              />
            )}
            <DailyAudio />

            {!replicaSessionId && (
              <div className="video-waiting">
                <span className="spinner" />
                <p>Waiting for the Tavus replica to join…</p>
              </div>
            )}

            <div className="direct-controls">
              <button type="button" onClick={toggleMicrophone}>
                {isMuted ? <MicOffIcon /> : <MicIcon />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                type="button"
                className="end-button"
                onClick={() => void endConversation()}
              >
                <EndCallIcon />
                <span>End</span>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function getStatusLabel(status: SessionStatus, hasReplica: boolean) {
  if (status === 'creating') return 'Creating conversation';
  if (status === 'joining') return 'Joining Daily room';
  if (status === 'connected' && !hasReplica) return 'Waiting for avatar';
  if (status === 'connected') return 'Live conversation';
  if (status === 'ending') return 'Ending conversation';
  if (status === 'error') return 'Connection error';
  return 'Ready to connect';
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 10.5V7c0-1.1-.9-2-2-2H5C3.9 5 3 5.9 3 7v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.5l4 4v-11l-4 4Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5.3-3a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 6 6.92V21H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 11h-1.7Z" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4.27 3 16.73 16.73-1.27 1.27-4.19-4.19A6.8 6.8 0 0 1 13 17.92V21h2v2H9v-2h2v-3.08A7 7 0 0 1 5 11h1.7a5.3 5.3 0 0 0 7.55 4.79l-1.37-1.37c-.28.12-.57.2-.88.2a3.6 3.6 0 0 1-3-1.62L3 7l1.27-4ZM9 5a3 3 0 0 1 5.83-.98A2.92 2.92 0 0 1 15 5v5.73L9 4.73V5Zm8.3 6H19a6.95 6.95 0 0 1-.57 2.77l-1.32-1.32c.12-.47.19-.95.19-1.45Z" />
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9c-3.07 0-5.95.78-8.45 2.15A1 1 0 0 0 3 12v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-.85l.25-1.85a11.4 11.4 0 0 1 7.5 0l.25 1.85A1 1 0 0 0 17 16h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-.55-.85A17.55 17.55 0 0 0 12 9Z" />
    </svg>
  );
}
