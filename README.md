# Kaya Avatar Agent demo

A lightweight React/Vite avatar client with two runtime modes:

- `kaya` embeds a published Kaya Avatar Agent workflow.
- `mock` talks to the local Node backend, which creates a Tavus conversation;
  the React client joins and renders the returned Daily room directly.

The project is organized as:

```text
client/  React/Vite frontend and its environment configuration
server/  Node/Express mock Tavus API and its environment configuration
```

## Run locally

```bash
npm install
npm run dev
```

This starts:

```text
Vite frontend:     http://localhost:5173
Mock Tavus API:    http://localhost:8787
```

On Windows PowerShell, use `npm.cmd` if script execution blocks `npm.ps1`.

## Kaya mode

Set the frontend environment in `client/.env.local`:

```env
VITE_AVATAR_MODE=kaya
VITE_KAYA_URL=http://localhost:3000
VITE_KAYA_WORKSPACE_ID=c69c3a07-7977-4335-a27a-35dc8ba3d9bc
VITE_KAYA_WORKFLOW_ID=9fb702bc-f53b-4268-bcf9-1aed9d0525b4
```

Kaya mode requires:

- A published iFlow containing an Avatar Agent
- A configured Tavus Avatar Model and ready replica
- The frontend hostname in the Avatar Agent's Site Whitelisting setting
- Kaya admin frontend, admin backend, and workflow engine running

## Direct Tavus mock mode

Copy the server environment template:

```powershell
Copy-Item server/.env.example server/.env
```

Fill these values in `server/.env`:

```env
TAVUS_API_KEY=your-private-tavus-api-key
TAVUS_PERSONA_ID=your-persona-id
TAVUS_REPLICA_ID=your-replica-id
DEFAULT_CALL_DURATION_SECONDS=300
MAX_CALL_DURATION_SECONDS=900
```

The API key stays in the Node process and is never sent to the browser. Then
switch `client/.env.local`:

```env
VITE_AVATAR_MODE=mock
VITE_MOCK_API_URL=http://localhost:8787
```

Restart `npm run dev`, then open either `http://localhost:5173` or
`http://avatar.localhost:5173`.

Before connecting, mock mode lets the user choose a 1, 5, 10, or 15 minute
conversation. The backend validates the requested duration, sends it to Tavus
as `properties.max_call_duration`, and returns an absolute expiry time for the
frontend countdown. `MAX_CALL_DURATION_SECONDS` is the server-enforced upper
limit.

The mock backend exposes:

```text
GET  /api/health
POST /api/conversations
POST /api/conversations/:conversationId/end
```

Mock mode deliberately does not include Kaya workflow tools, RAG, Insights,
heartbeat, transcript export, workspace authorization, or license checks.

## Build

```bash
npm run build
npm run preview
```

Vite environment values are public browser configuration. Never put Tavus,
Kaya, or workspace API keys in a `VITE_*` variable. Production deployments
must use HTTPS for microphone access and must add authentication, rate limiting,
and persistent session ownership in front of the mock API.