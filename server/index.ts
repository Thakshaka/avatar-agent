import cors from 'cors';
import dotenv from 'dotenv';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TavusApiError, TavusClient } from './tavus-client.js';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(serverDirectory, '.env') });

const port = readPositiveInteger(process.env.PORT, 8787);
const maxCallDurationSeconds = readPositiveInteger(
  process.env.MAX_CALL_DURATION_SECONDS,
  900,
);
const configuredDefaultDuration = readPositiveInteger(
  process.env.DEFAULT_CALL_DURATION_SECONDS,
  300,
);
const defaultCallDurationSeconds = Math.min(
  configuredDefaultDuration,
  maxCallDurationSeconds,
);
const allowedOrigins = new Set(
  (
    process.env.FRONTEND_ORIGINS ||
    'http://localhost:5173,http://avatar.localhost:5173'
  )
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
);

const tavusConfig = {
  apiKey: process.env.TAVUS_API_KEY?.trim() || '',
  personaId: process.env.TAVUS_PERSONA_ID?.trim() || '',
  replicaId: process.env.TAVUS_REPLICA_ID?.trim() || '',
};
const missingConfig = [
  ['TAVUS_API_KEY', tavusConfig.apiKey],
  ['TAVUS_PERSONA_ID', tavusConfig.personaId],
  ['TAVUS_REPLICA_ID', tavusConfig.replicaId],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);
const tavusClient = new TavusClient({
  apiKey: tavusConfig.apiKey,
  apiUrl: process.env.TAVUS_API_URL,
});
const activeConversations = new Set<string>();

const app = express();
app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed.`));
    },
    methods: ['GET', 'POST'],
  }),
);
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    tavusConfigured: missingConfig.length === 0,
    missingConfig,
    defaultCallDurationSeconds,
    maxCallDurationSeconds,
  });
});

app.post('/api/conversations', async (request, response, next) => {
  try {
    assertTavusConfigured();
    const requestedDurationSeconds = resolveCallDuration(
      request.body?.durationSeconds,
    );
    const conversationStartedAt = Date.now();

    const conversation = await tavusClient.createConversation({
      personaId: tavusConfig.personaId,
      replicaId: tavusConfig.replicaId,
      conversationName:
        process.env.TAVUS_CONVERSATION_NAME || 'Avatar Agent Demo',
      conversationalContext: process.env.TAVUS_CONVERSATIONAL_CONTEXT,
      maxCallDurationSeconds: requestedDurationSeconds,
    });

    activeConversations.add(conversation.conversationId);
    response.status(201).json({
      ...conversation,
      maxCallDurationSeconds: requestedDurationSeconds,
      expiresAt: new Date(
        conversationStartedAt + requestedDurationSeconds * 1000,
      ).toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

app.post(
  '/api/conversations/:conversationId/end',
  async (request, response, next) => {
    const conversationId = request.params.conversationId;

    try {
      assertTavusConfigured();

      if (!activeConversations.has(conversationId)) {
        response.status(404).json({
          error: 'Conversation is not active on this mock server.',
        });
        return;
      }

      await tavusClient.endConversation(conversationId);
      activeConversations.delete(conversationId);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof TavusApiError) {
      const status =
        error.status >= 400 && error.status < 500 ? error.status : 502;
      response.status(status).json({
        error: error.message,
        details: error.details,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    response.status(500).json({ error: message });
  },
);

const server = app.listen(port, () => {
  console.log(`Mock Tavus API listening on http://localhost:${port}`);
  console.log(`Allowed frontend origins: ${[...allowedOrigins].join(', ')}`);
  if (missingConfig.length > 0) {
    console.warn(
      `Tavus mock mode needs server/.env values: ${missingConfig.join(', ')}`,
    );
  }
});

async function shutdown() {
  server.close();
  await Promise.allSettled(
    [...activeConversations].map((conversationId) =>
      tavusClient.endConversation(conversationId),
    ),
  );
  process.exit(0);
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

function assertTavusConfigured() {
  if (missingConfig.length > 0) {
    throw new TavusApiError(
      `Mock backend is missing: ${missingConfig.join(', ')}. Add them to server/.env.`,
      503,
    );
  }
}

function resolveCallDuration(value: unknown): number {
  if (value === undefined || value === null) {
    return defaultCallDurationSeconds;
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 60 ||
    value > maxCallDurationSeconds
  ) {
    throw new TavusApiError(
      `Duration must be a whole number between 60 and ${maxCallDurationSeconds} seconds.`,
      400,
    );
  }

  return value;
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
