const DEFAULT_TAVUS_API_URL = 'https://tavusapi.com/v2';
const REQUEST_TIMEOUT_MS = 20_000;

export interface TavusClientConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface CreateConversationInput {
  personaId: string;
  replicaId: string;
  conversationName?: string;
  conversationalContext?: string;
  maxCallDurationSeconds?: number;
}

export interface TavusConversation {
  conversationId: string;
  conversationUrl: string;
}

export class TavusApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'TavusApiError';
  }
}

export class TavusClient {
  private readonly apiUrl: string;

  constructor(private readonly config: TavusClientConfig) {
    this.apiUrl = (config.apiUrl || DEFAULT_TAVUS_API_URL).replace(/\/+$/, '');
  }

  async createConversation(
    input: CreateConversationInput,
  ): Promise<TavusConversation> {
    const properties: Record<string, number> = {};
    if (input.maxCallDurationSeconds) {
      properties.max_call_duration = input.maxCallDurationSeconds;
    }

    const payload = {
      persona_id: input.personaId,
      replica_id: input.replicaId,
      ...(input.conversationName && {
        conversation_name: input.conversationName,
      }),
      ...(input.conversationalContext && {
        conversational_context: input.conversationalContext,
      }),
      ...(Object.keys(properties).length > 0 && { properties }),
    };

    const response = await this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as Record<string, unknown>;
    const conversationId = data.conversation_id;
    const conversationUrl = data.conversation_url;

    if (
      typeof conversationId !== 'string' ||
      typeof conversationUrl !== 'string'
    ) {
      throw new TavusApiError(
        'Tavus returned an invalid conversation response.',
        502,
        data,
      );
    }

    return { conversationId, conversationUrl };
  }

  async endConversation(conversationId: string): Promise<void> {
    const response = await this.request(
      `/conversations/${encodeURIComponent(conversationId)}/end`,
      { method: 'POST' },
      [404],
    );

    if (response.body) {
      await response.body.cancel().catch(() => undefined);
    }
  }

  private async request(
    path: string,
    init: RequestInit,
    acceptedErrorStatuses: number[] = [],
  ): Promise<Response> {
    let response: Response;

    try {
      response = await fetch(`${this.apiUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          ...init.headers,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown network error';
      throw new TavusApiError(`Could not reach Tavus: ${message}`, 502);
    }

    if (
      !response.ok &&
      !acceptedErrorStatuses.includes(response.status)
    ) {
      const details = await response.text().catch(() => '');
      throw new TavusApiError(
        `Tavus request failed with status ${response.status}.`,
        response.status,
        details,
      );
    }

    return response;
  }
}
